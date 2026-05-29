'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { requireVenue, ACTIVE_VENUE_COOKIE } from '@/lib/queries/auth'
import { isPremium } from '@/lib/plan'
import { z } from 'zod'

const VenueSchema = z.object({
  name:     z.string().min(1, 'Venue name is required').max(80),
  timezone: z.string().max(50).default('Asia/Manila'),
})

export interface VenueInput {
  name: string
  timezone?: string
}

/**
 * Switch the active venue for this session. The venue must belong to the
 * caller's account — otherwise the switch is silently ignored.
 */
export async function switchVenue(venueId: string): Promise<{ error?: string }> {
  const { venues: userVenues } = await requireVenue()
  const found = userVenues.find(v => v.id === venueId)
  if (!found) return { error: 'Venue not found' }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_VENUE_COOKIE, venueId, {
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  // Every dashboard route reads the active venue — invalidate broadly so the
  // next page render reflects the switch.
  revalidatePath('/', 'layout')
  return {}
}

/**
 * Create a new venue under the caller's account.
 * - Premium accounts can create unlimited venues.
 * - Non-Premium accounts are locked to 1 venue. Returns a clear error so the
 *   UI can route to the upgrade flow.
 */
export async function addVenue(input: VenueInput): Promise<{ error?: string; venueId?: string }> {
  const parsed = VenueSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  try {
    const { account } = await requireVenue()

    if (!isPremium(account)) {
      const [{ c }] = await db
        .select({ c: count() })
        .from(venues)
        .where(eq(venues.accountId, account.id))
      if (c >= 1) {
        return { error: 'Multi-venue is a Premium feature.' }
      }
    }

    const [created] = await db.insert(venues).values({
      accountId: account.id,
      name:      parsed.data.name.trim(),
      timezone:  parsed.data.timezone || 'Asia/Manila',
    }).returning({ id: venues.id })

    // Auto-switch to the freshly-created venue so the owner lands in it
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_VENUE_COOKIE, created.id, {
      path:     '/',
      maxAge:   60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    revalidatePath('/', 'layout')
    return { venueId: created.id }
  } catch (e) {
    console.error('[addVenue]', e)
    const detail = e instanceof Error ? e.message : String(e)
    return { error: `Failed to create venue: ${detail}` }
  }
}

/**
 * Delete a venue and all its data. Only allowed if the account has more than
 * one venue (we don't want to leave an account with zero venues — that breaks
 * the dashboard).
 */
export async function deleteVenue(venueId: string): Promise<{ error?: string }> {
  try {
    const { account, venues: userVenues } = await requireVenue()
    if (userVenues.length <= 1) {
      return { error: 'You need at least one venue. Add another before deleting this one.' }
    }
    const target = userVenues.find(v => v.id === venueId)
    if (!target) return { error: 'Venue not found' }

    await db.delete(venues).where(and(eq(venues.id, venueId), eq(venues.accountId, account.id)))

    // If we just deleted the active venue, clear the cookie so requireVenue
    // falls back to the oldest remaining venue
    const cookieStore = await cookies()
    if (cookieStore.get(ACTIVE_VENUE_COOKIE)?.value === venueId) {
      cookieStore.delete(ACTIVE_VENUE_COOKIE)
    }

    revalidatePath('/', 'layout')
    return {}
  } catch (e) {
    console.error('[deleteVenue]', e)
    const detail = e instanceof Error ? e.message : String(e)
    return { error: `Failed to delete venue: ${detail}` }
  }
}

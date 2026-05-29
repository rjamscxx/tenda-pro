import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { accounts, users, venues } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

const ACTIVE_VENUE_COOKIE = 'sizzle-active-venue'

const getUserCached = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Resolves the active venue for the current request:
 *  1. user must be signed in
 *  2. read the active-venue cookie if present
 *  3. pick the cookie's venue if it belongs to this user's account
 *  4. otherwise fall back to the oldest venue on the account
 *
 * Returns the user + all their venues + the active venue + account.
 */
export const requireVenue = cache(async () => {
  const user = await getUserCached()
  if (!user) redirect('/login')

  // All venues + user + account in one round-trip
  const rows = await db
    .select({ venue: venues, dbUser: users, account: accounts })
    .from(users)
    .innerJoin(venues, eq(venues.accountId, users.accountId))
    .innerJoin(accounts, eq(accounts.id, users.accountId))
    .where(eq(users.id, user.id))
    .orderBy(asc(venues.createdAt))

  if (rows.length === 0) redirect('/onboarding')

  const dbUser  = rows[0].dbUser
  const account = rows[0].account
  const allVenues = rows.map(r => r.venue)

  // Active venue resolution
  const cookieStore = await cookies()
  const preferredId = cookieStore.get(ACTIVE_VENUE_COOKIE)?.value
  const active = (preferredId && allVenues.find(v => v.id === preferredId)) || allVenues[0]

  return {
    authUser: user,
    dbUser,
    venue: active,
    venues: allVenues,
    account,
  }
})

export { ACTIVE_VENUE_COOKIE }

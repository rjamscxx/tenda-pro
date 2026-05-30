'use server'

import { requireVenue } from '@/lib/queries/auth'
import { isPremium } from '@/lib/plan'
import { getOrGenerateTodayPush } from '@/lib/ai/todayPush'

/**
 * Server action used by the dashboard "AI today's push" card's refresh
 * button. Premium-only. Forces regeneration.
 */
export async function refreshTodayPush(): Promise<string | null> {
  const { venue, account } = await requireVenue()
  if (!isPremium(account)) return null
  return getOrGenerateTodayPush(account.id, venue.id, true)
}

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { accounts, users, venues } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

const getUserCached = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const requireVenue = cache(async () => {
  const user = await getUserCached()
  if (!user) redirect('/login')

  const [result] = await db
    .select({ venue: venues, dbUser: users, account: accounts })
    .from(users)
    .innerJoin(venues, eq(venues.accountId, users.accountId))
    .innerJoin(accounts, eq(accounts.id, users.accountId))
    .where(eq(users.id, user.id))
    .limit(1)

  if (!result) redirect('/onboarding')
  return { authUser: user, dbUser: result.dbUser, venue: result.venue, account: result.account }
})

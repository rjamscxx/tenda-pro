import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import LandingClient from './LandingClient'

export const metadata = {
  title: 'Sizzle — The Operating Dashboard for Restaurant Owners',
  description: 'Track every peso, cut waste, and grow your margins. Sizzle gives restaurant and café owners a clear financial picture in one dashboard.',
}

export default async function Page() {
  const [supabase, cookieStore] = await Promise.all([createClient(), cookies()])
  const { data: { user } } = await supabase.auth.getUser()
  const initialTheme = cookieStore.get('sizzle-theme')?.value ?? 'sage-dark'
  return <LandingClient isLoggedIn={!!user} initialTheme={initialTheme} />
}

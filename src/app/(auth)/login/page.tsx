import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TendaLogo from '@/components/ui/TendaLogo'
import Wordmark from '@/components/ui/Wordmark'
import LoginForm from './LoginForm'

export const metadata = { title: 'Sign in — Tenda Pro' }

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-4 hover:text-ink-2 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to home
      </Link>

      <div className="glass glow rounded-2xl p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TendaLogo size={26} variant="badge" />
            <Wordmark className="text-[17px]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
            <p className="text-sm text-ink-3">Your business, at a glance.</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

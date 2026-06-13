import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TendaLogo from '@/components/ui/TendaLogo'
import SignupForm from './SignupForm'

export const metadata = { title: 'Create account — Tenda' }

export default async function SignupPage() {
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
            <span className="font-semibold text-[17px] tracking-[-0.02em] gradient-text leading-none">Tenda</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">Start for free</h1>
            <p className="text-sm text-ink-3">Track sales, costs, and staff — all in one place.</p>
          </div>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}

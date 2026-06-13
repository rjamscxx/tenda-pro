import Link from 'next/link'
import TendaLogo from '@/components/ui/TendaLogo'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata = { title: 'Reset password — Tenda' }

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-ink-4 hover:text-ink-2 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to sign in
      </Link>

      <div className="glass glow rounded-2xl p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <TendaLogo size={28} variant="badge" />
            <span className="font-semibold text-[17px] tracking-tight gradient-text">Tenda</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">Forgot your password?</h1>
            <p className="text-sm text-ink-3">Enter your email and we&apos;ll send a reset link.</p>
          </div>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}

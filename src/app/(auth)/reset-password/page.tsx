import TendaLogo from '@/components/ui/TendaLogo'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata = { title: 'Set new password — Tenda Pro' }

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="glass glow rounded-2xl p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TendaLogo size={26} variant="badge" />
            <span className="font-semibold text-[17px] tracking-[-0.02em] gradient-text leading-none">Tenda Pro</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">Set new password</h1>
            <p className="text-sm text-ink-3">Choose something strong and memorable.</p>
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}

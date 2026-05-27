import Link from 'next/link'

const PRO_FEATURES = [
  'Waste Log & Spoilage Tracking',
  'Employee Management',
  'Payroll Runs',
  'CSV Exports',
  'Daily Email Digest',
  'Unlimited AI Messages',
]

export default function ProLockPage({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="glass card-glow rounded-2xl p-10 max-w-md w-full space-y-6 text-center">

        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto text-3xl select-none">
          🔒
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold mb-3">
            Pro Feature
          </div>
          <h2 className="text-lg font-semibold text-ink">{feature}</h2>
          <p className="text-sm text-ink-4 mt-2 leading-relaxed">
            Upgrade to Sizzle Pro to unlock {feature} and everything below.
          </p>
        </div>

        <div className="text-left space-y-2.5 border border-hair rounded-xl p-4 bg-surface/40">
          {PRO_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-ink-3">
              <span className="text-accent shrink-0">✓</span>
              {f}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/settings#plan"
            className="block w-full text-center px-6 py-3 btn-primary rounded-xl font-semibold text-sm"
          >
            Upgrade to Pro →
          </Link>
          <p className="text-xs text-ink-4">No credit card required during beta.</p>
        </div>
      </div>
    </div>
  )
}

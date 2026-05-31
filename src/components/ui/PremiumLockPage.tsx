'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startTrial } from '@/app/(dashboard)/settings/actions'

const PRO_FEATURES = [
  '90-day Revenue Trend & 7-day Forecast',
  'Day-of-Week Performance Breakdown',
  'Expense Category Analysis',
  'Monthly P&L Table (6 months)',
  'Everything else in Pro',
]

export default function PremiumLockPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'trial' | 'monthly' | 'annual' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleTrial() {
    setLoading('trial')
    await startTrial()
    router.refresh()
    setLoading(null)
  }

  async function handleActivate(billing: 'monthly' | 'annual') {
    setLoading(billing)
    setError(null)
    try {
      const res = await fetch(`/api/paymongo/checkout?billing=${billing}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout. Try again in a moment.')
        setLoading(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — check your connection and try again.')
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="glass card-glow rounded-2xl p-10 max-w-md w-full space-y-6 text-center">

        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto text-3xl select-none">
          📊
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold mb-3">
            Pro Feature
          </div>
          <h2 className="text-lg font-semibold text-ink">Advanced Analytics</h2>
          <p className="text-sm text-ink-4 mt-2 leading-relaxed">
            Upgrade to Pro to unlock deep analytics, revenue forecasting, and multi-month P&L insights.
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
          <button
            disabled={!!loading}
            onClick={handleTrial}
            className="block w-full text-center px-6 py-3 btn-primary rounded-xl font-semibold text-sm disabled:opacity-60"
          >
            {loading === 'trial' ? 'Activating…' : 'Start 14-day free trial →'}
          </button>
          <button
            disabled={!!loading}
            onClick={() => handleActivate('monthly')}
            className="block w-full text-center px-6 py-2.5 rounded-xl font-semibold text-sm border border-accent/40 text-accent hover:bg-accent/10 transition-colors disabled:opacity-60"
          >
            {loading === 'monthly' ? 'Redirecting…' : 'Subscribe monthly — ₱399/mo →'}
          </button>
          <button
            disabled={!!loading}
            onClick={() => handleActivate('annual')}
            className="block w-full text-center px-6 py-2.5 rounded-xl font-semibold text-sm border border-hair text-ink-3 hover:border-accent hover:text-accent transition-colors disabled:opacity-60"
          >
            {loading === 'annual' ? 'Redirecting…' : 'Subscribe annually — ₱4,000/yr (save ₱788) →'}
          </button>
          <p className="text-xs text-ink-4">Pay via GCash, Maya, card, or bank transfer. Cancel anytime.</p>
          {error && (
            <p className="text-xs text-danger leading-snug">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

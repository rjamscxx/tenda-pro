'use client'

import { useState } from 'react'

const PREMIUM_FEATURES = [
  'Advanced Analytics & Revenue Trends',
  '7-Day Revenue Forecast',
  'Day-of-Week Performance Heatmap',
  'Expense Category Breakdown',
  'Month-over-Month P&L Report',
  'Everything in Pro',
]

export default function PremiumLockPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Route through PayMongo Checkout (test mode while PAYMONGO_SECRET_KEY is a
  // sk_test_... key). The webhook activates the account after the test payment.
  async function handleActivate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paymongo/checkout?plan=premium', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout. Try again in a moment.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="glass card-glow rounded-2xl p-10 max-w-md w-full space-y-6 text-center">

        <div className="w-14 h-14 rounded-2xl bg-warn/10 flex items-center justify-center mx-auto text-3xl select-none">
          💎
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warn/15 text-warn text-xs font-semibold mb-3">
            Premium Feature
          </div>
          <h2 className="text-lg font-semibold text-ink">Advanced Analytics</h2>
          <p className="text-sm text-ink-4 mt-2 leading-relaxed">
            Upgrade to Premium to unlock deep analytics, revenue forecasting, and multi-month P&L insights.
          </p>
        </div>

        <div className="text-left space-y-2.5 border border-warn/20 rounded-xl p-4 bg-warn/5">
          {PREMIUM_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-ink-3">
              <span className="text-warn shrink-0">✓</span>
              {f}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            disabled={loading}
            onClick={handleActivate}
            className="block w-full text-center px-6 py-3 rounded-xl font-semibold text-sm bg-warn/15 text-warn border border-warn/30 hover:bg-warn/25 transition-colors disabled:opacity-60"
          >
            {loading ? 'Activating…' : 'Subscribe to Premium — ₱1,999/mo →'}
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

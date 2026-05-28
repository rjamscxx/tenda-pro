'use client'

import { useTransition } from 'react'
import { downgradeTofree } from '@/app/(dashboard)/settings/actions'

interface Props {
  trialExpired: boolean
}

export default function TrialExpiredModal({ trialExpired }: Props) {
  const [isPending, startTransition] = useTransition()

  if (!trialExpired) return null

  async function handleCheckout(plan: 'pro' | 'premium') {
    const res = await fetch(`/api/paymongo/checkout?plan=${plan}`, { method: 'POST' })
    const json = await res.json() as { url?: string; error?: string }
    if (json.url) window.location.href = json.url
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-8 space-y-6 shadow-2xl border border-hair">
        <div className="text-center space-y-2">
          <p className="text-3xl">⏱</p>
          <h2 className="text-xl font-semibold text-ink tracking-tight">Your free trial has ended</h2>
          <p className="text-sm text-ink-4 max-w-sm mx-auto">
            Choose a plan to continue. Basic keeps your data but locks Pro features.
          </p>
        </div>

        <div className="space-y-3">
          {/* Basic */}
          <div className="rounded-xl border border-hair bg-surface/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Basic</p>
              <p className="text-sm font-semibold text-ink">Free forever</p>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed">
              Sales, expenses, menu & recipe costing (up to 20 dishes), inventory, 6-month reports.
            </p>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => downgradeTofree())}
              className="w-full py-2 rounded-lg text-sm font-medium border border-hair text-ink-3 hover:border-accent hover:text-accent transition-colors disabled:opacity-60"
            >
              {isPending ? 'Updating…' : 'Continue with Basic — Free →'}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Pro</p>
              <p className="text-sm font-semibold text-accent">₱399 / month</p>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed">
              Everything in Basic + unlimited dishes & ingredients, employees, payroll, waste log, CSV exports.
            </p>
            <button
              onClick={() => handleCheckout('pro')}
              className="w-full py-2 btn-primary rounded-lg text-sm font-semibold"
            >
              Subscribe to Pro — ₱399/mo →
            </button>
          </div>

          {/* Premium */}
          <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Premium</p>
              <p className="text-sm font-semibold text-warn">₱1,999 / month</p>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed">
              Everything in Pro + multiple businesses, AI-powered insights, advanced analytics, dedicated support.
            </p>
            <button
              onClick={() => handleCheckout('premium')}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-warn/15 text-warn border border-warn/30 hover:bg-warn/25 transition-colors"
            >
              Subscribe to Premium — ₱1,999/mo →
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-4 text-center">
          Pay via GCash, Maya, card, or bank transfer. Cancel anytime from Settings.
        </p>
      </div>
    </div>
  )
}

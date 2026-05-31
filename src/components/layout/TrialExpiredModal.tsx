'use client'

import { useTransition } from 'react'
import { downgradeTofree } from '@/app/(dashboard)/settings/actions'

interface Props {
  trialExpired: boolean
}

export default function TrialExpiredModal({ trialExpired }: Props) {
  const [isPending, startTransition] = useTransition()

  if (!trialExpired) return null

  async function handleCheckout(billing: 'monthly' | 'annual') {
    const res = await fetch(`/api/paymongo/checkout?billing=${billing}`, { method: 'POST' })
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

          {/* Pro monthly */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Pro</p>
              <p className="text-sm font-semibold text-accent">₱399 / month</p>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed">
              Everything in Basic + unlimited dishes, employees, payroll, waste log, analytics, CSV exports.
            </p>
            <button
              onClick={() => handleCheckout('monthly')}
              className="w-full py-2 btn-primary rounded-lg text-sm font-semibold"
            >
              Subscribe monthly — ₱399/mo →
            </button>
          </div>

          {/* Pro annual */}
          <div className="rounded-xl border border-hair/40 bg-surface/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Pro Annual</p>
              <p className="text-sm font-semibold text-accent">₱4,000 / year</p>
            </div>
            <p className="text-xs text-ink-4 leading-relaxed">
              Same as Pro, billed once a year. Save ₱788 vs monthly.
            </p>
            <button
              onClick={() => handleCheckout('annual')}
              className="w-full py-2 rounded-lg text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
            >
              Subscribe annually — ₱4,000/yr →
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

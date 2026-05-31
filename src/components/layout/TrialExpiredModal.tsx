'use client'

import { useState, useTransition } from 'react'
import { downgradeTofree } from '@/app/(dashboard)/settings/actions'

interface Props {
  trialExpired: boolean
}

export default function TrialExpiredModal({ trialExpired }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showEmail, setShowEmail] = useState(false)

  if (!trialExpired) return null

  const emailSubject = encodeURIComponent('Sizzle Pro Upgrade Request')
  const emailBody = encodeURIComponent(
    'Hi RJ,\n\nI\'d like to upgrade my Sizzle account to Pro.\n\nMy account email: \n\nPlease let me know the next steps.\n\nThank you!'
  )
  const mailtoHref = `mailto:rjamscxx@gmail.com?subject=${emailSubject}&body=${emailBody}`

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-8 space-y-6 shadow-2xl border border-hair">
        {!showEmail ? (
          <>
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
                  Everything in Basic + unlimited dishes, employees, payroll, waste log, analytics, CSV exports.
                </p>
                <button
                  onClick={() => setShowEmail(true)}
                  className="w-full py-2 btn-primary rounded-lg text-sm font-semibold"
                >
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <p className="text-3xl">✉️</p>
              <h2 className="text-xl font-semibold text-ink tracking-tight">One step away from Pro</h2>
              <p className="text-sm text-ink-4 max-w-sm mx-auto">
                Send us an email and we'll activate your Pro account within 24 hours.
              </p>
            </div>

            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-3 text-center">
              <p className="text-xs text-ink-4">Send an email to</p>
              <p className="text-sm font-semibold text-ink">rjamscxx@gmail.com</p>
              <p className="text-xs text-ink-4">with your account email and we'll take care of the rest.</p>
              <a
                href={mailtoHref}
                className="block w-full py-2 btn-primary rounded-lg text-sm font-semibold text-center"
              >
                Open email app →
              </a>
            </div>

            <button
              onClick={() => setShowEmail(false)}
              className="w-full text-xs text-ink-4 hover:text-ink transition-colors"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

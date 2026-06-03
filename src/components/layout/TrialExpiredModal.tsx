'use client'

import { useState, useTransition } from 'react'
import { downgradeTofree } from '@/app/(dashboard)/settings/actions'

interface Props {
  trialExpired: boolean
  userEmail: string
  userFullName: string
}

const QR_CODES = [
  { name: 'GCash',  src: '/payment-qrs/gcash.jpg'  },
  { name: 'GoTyme', src: '/payment-qrs/gotyme.jpg' },
  { name: 'BPI',    src: '/payment-qrs/bpi.jpg'    },
]

export default function TrialExpiredModal({ trialExpired, userEmail, userFullName }: Props) {
  const [isPending, startTransition] = useTransition()

  // 'choose' | 'form' | 'sent'
  const [screen, setScreen] = useState<'choose' | 'form' | 'sent'>('choose')
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // Form fields
  const [fullName, setFullName] = useState(userFullName)
  const [phone,    setPhone]    = useState('')

  // Receipt upload
  const [receiptPreview,   setReceiptPreview]   = useState<string | null>(null)
  const [receiptUrl,       setReceiptUrl]       = useState<string | null>(null)
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [receiptError,     setReceiptError]     = useState<string | null>(null)

  // Submit
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!trialExpired) return null

  async function compressAndUpload(file: File) {
    setReceiptUploading(true)
    setReceiptError(null)
    setReceiptUrl(null)
    try {
      const bitmap = await createImageBitmap(file)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.75))
      setReceiptPreview(URL.createObjectURL(blob))
      const fd = new FormData()
      fd.append('file', new File([blob], 'receipt.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/upload-receipt', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setReceiptUrl(data.url)
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setReceiptUploading(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/subscription-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email: userEmail, billing, receiptUrl: receiptUrl ?? undefined }),
      })
      if (!res.ok) throw new Error('Could not send request. Please try again.')
      setScreen('sent')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-lg my-auto p-8 space-y-6 shadow-2xl border border-hair">

        {/* ── Screen 1: Choose plan ── */}
        {screen === 'choose' && (
          <>
            <div className="text-center space-y-2">
              <p className="text-3xl">⏱</p>
              <h2 className="text-xl font-semibold text-ink tracking-tight">Your free trial has ended</h2>
              <p className="text-sm text-ink-4 max-w-sm mx-auto">
                Choose a plan to continue. Basic keeps your data but locks Pro features.
              </p>
            </div>

            <div className="space-y-3">
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

              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink text-sm">Pro</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">₱399 / month</p>
                    <p className="text-[10px] text-ink-4">or ₱4,000 / year</p>
                  </div>
                </div>
                <p className="text-xs text-ink-4 leading-relaxed">
                  Everything in Basic + unlimited dishes, employees, payroll, waste log, analytics, CSV exports.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBilling('monthly'); setScreen('form') }}
                    className="flex-1 py-2 btn-primary rounded-lg text-sm font-semibold"
                  >
                    Monthly →
                  </button>
                  <button
                    onClick={() => { setBilling('annual'); setScreen('form') }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
                  >
                    Annual →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Screen 2: Subscribe form ── */}
        {screen === 'form' && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button onClick={() => setScreen('choose')} className="text-ink-4 hover:text-ink transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h2 className="text-base font-semibold text-ink">
                  {billing === 'annual' ? 'Pro Annual — ₱4,000/yr' : 'Pro Monthly — ₱399/mo'}
                </h2>
              </div>
              <p className="text-sm text-ink-4 pl-6">Pay via any option below, then fill out the form with your receipt.</p>
            </div>

            {/* QR codes */}
            <div className="flex gap-3">
              {QR_CODES.map(({ name, src }) => (
                <div key={name} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-white rounded-xl border border-hair overflow-hidden p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${name} QR code`} className="w-full aspect-square object-contain" />
                  </div>
                  <span className="text-xs font-semibold text-ink-3">{name}</span>
                </div>
              ))}
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  className="input-field w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Contact Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="input-field w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="input-field w-full opacity-60 cursor-not-allowed"
                />
                <p className="text-[11px] text-ink-4">This is your account email — used to activate your plan.</p>
              </div>

              {/* Receipt upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-3">
                  Payment Receipt <span className="text-ink-4 font-normal">(GCash, GoTyme, BPI)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed border-hair hover:border-accent/50 p-3 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) compressAndUpload(f) }}
                  />
                  {receiptPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={receiptPreview} alt="Receipt" className="h-14 w-14 object-cover rounded-md shrink-0" />
                    : <span className="text-xl">📎</span>
                  }
                  <div className="min-w-0">
                    {receiptUploading && <p className="text-xs text-ink-4">Compressing & uploading…</p>}
                    {receiptUrl && !receiptUploading && <p className="text-xs text-accent">Receipt uploaded ✓</p>}
                    {receiptError && <p className="text-xs text-danger">{receiptError}</p>}
                    {!receiptPreview && !receiptUploading && <p className="text-xs text-ink-4">Tap to attach screenshot</p>}
                  </div>
                </label>
              </div>
            </div>

            {submitError && <p className="text-xs text-danger text-center">{submitError}</p>}
            <button
              disabled={!fullName || !phone || receiptUploading || submitting}
              onClick={handleSubmit}
              className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Send request →'}
            </button>
          </>
        )}

        {/* ── Screen 3: Success ── */}
        {screen === 'sent' && (
          <div className="text-center space-y-4 py-4">
            <p className="text-4xl">🎉</p>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-ink">Request sent!</h2>
              <p className="text-sm text-ink-4">
                We&apos;ll activate your Pro account within 24 hours after confirming your payment.
              </p>
            </div>
            <p className="text-xs text-ink-4">In the meantime you can keep using Basic features.</p>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => downgradeTofree())}
              className="w-full py-2 rounded-lg text-sm font-medium border border-hair text-ink-3 hover:border-accent hover:text-accent transition-colors disabled:opacity-60"
            >
              {isPending ? 'Updating…' : 'Continue with Basic for now →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

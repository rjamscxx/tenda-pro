'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordForm() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim flex items-center justify-center mx-auto">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-accent">
            <path d="M2 6l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Check your email</p>
          <p className="text-sm text-ink-3 mt-1">
            We sent a reset link to <span className="text-ink">{email}</span>.
            It expires in 1 hour.
          </p>
        </div>
        <a href="/login" className="block text-sm text-accent hover:underline">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="you@example.com"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>

      <p className="text-center text-sm text-ink-3">
        Remember it?{' '}
        <a href="/login" className="text-accent hover:underline">Sign in</a>
      </p>
    </form>
  )
}

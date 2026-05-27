'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [ready, setReady]           = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  // Supabase puts the recovery token in the URL hash.
  // Auth state change fires with event=PASSWORD_RECOVERY once it's parsed.
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  if (!ready) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-ink-3">Verifying reset link…</p>
        <p className="text-xs text-ink-4">
          If nothing happens,{' '}
          <a href="/forgot-password" className="text-accent hover:underline">request a new link</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">New password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
            placeholder="8+ characters"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2 transition-colors"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}

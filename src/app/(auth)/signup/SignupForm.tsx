'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_ERRORS: Record<string, string> = {
  'User already registered':              'An account with this email already exists. Try signing in.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'Unable to validate email address: invalid format': 'That doesn\'t look like a valid email address.',
}

function friendlyError(msg: string): string {
  return SUPABASE_ERRORS[msg] ?? msg
}

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(friendlyError(signUpError.message))
      setLoading(false)
      return
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Account created — check your email to confirm, then sign in.')
        setLoading(false)
        return
      }
    }

    router.refresh()
    router.push('/onboarding')
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Password</label>
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
        {loading ? 'Creating account…' : 'Create free account'}
      </button>

      {/* Trust note */}
      <p className="text-center text-[11px] text-ink-4">
        Free forever &middot; No credit card &middot; 2-min setup
      </p>

      <p className="text-center text-sm text-ink-3">
        Already have an account?{' '}
        <a href="/login" className="text-accent hover:underline">Sign in</a>
      </p>
    </form>
  )
}

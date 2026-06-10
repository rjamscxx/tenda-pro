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

// Loose PH-friendly phone validation. Accepts +63 or 09 starts, 10-13 digits
// total once you strip whitespace, dashes and parens. Empty string allowed
// (contact number is optional at signup; user can add it later in Settings).
function isValidPhone(raw: string): boolean {
  const v = raw.replace(/[\s\-().]/g, '')
  if (v === '') return true
  return /^(\+?\d{10,13})$/.test(v)
}

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail]                 = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [password, setPassword]           = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [emailSent, setEmailSent]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isValidPhone(contactNumber)) {
      setError('Contact number looks invalid — use 09XX XXX XXXX or +63 9XX XXX XXXX.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    // contact_number rides on the auth user_metadata so it survives the email
    // verification round-trip and onboarding can persist it into our users
    // table alongside fullName.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { contact_number: contactNumber.trim() || null } },
    })

    if (signUpError) {
      setError(friendlyError(signUpError.message))
      setLoading(false)
      return
    }

    // session is null when email confirmation is required
    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    // session exists — email confirmation disabled, go straight to onboarding
    router.refresh()
    router.push('/onboarding')
  }

  if (emailSent) {
    return (
      <div className="space-y-5">
        {/* Mail icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-surface-2 border border-hair flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-accent"/>
              <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"/>
            </svg>
          </div>
        </div>

        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-semibold text-ink">Check your inbox</h2>
          <p className="text-sm text-ink-3 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-ink font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
        </div>

        <div className="rounded-lg bg-surface-2 border border-hair px-4 py-3 text-[13px] text-ink-3 space-y-1">
          <p>No email after a minute?</p>
          <ul className="list-disc list-inside space-y-0.5 text-ink-4">
            <li>Check your spam or promotions folder</li>
            <li>Make sure you entered the right address</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => { setEmailSent(false); setPassword('') }}
          className="w-full py-2.5 rounded-lg border border-hair text-sm font-medium text-ink-3 hover:text-ink hover:border-accent transition-colors"
        >
          Use a different email
        </button>

        <p className="text-center text-sm text-ink-3">
          Already confirmed?{' '}
          <a href="/login" className="text-accent hover:underline">Sign in</a>
        </p>
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
          Contact number <span className="text-ink-4 normal-case tracking-normal text-[10px]">(optional)</span>
        </label>
        <input
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={contactNumber}
          onChange={e => setContactNumber(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="09XX XXX XXXX"
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

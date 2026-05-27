'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If email confirmation is required, sign in anyway using the password
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Account created — please check your email to confirm, then sign in.')
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="8+ characters"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 btn-primary rounded-lg"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-ink-3">
        Already have an account?{' '}
        <a href="/login" className="text-accent hover:underline">Sign in</a>
      </p>
    </form>
  )
}

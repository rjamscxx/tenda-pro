'use client'

import { useState } from 'react'
import { createVenue } from './actions'

export default function OnboardingForm({ userId }: { userId: string }) {
  const [venueName, setVenueName] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createVenue({ userId, venueName, fullName })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Your name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="Lina Hartono"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Business name</label>
        <input
          type="text"
          required
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
          placeholder="Olive & Crumb"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading || !venueName.trim()}
        className="w-full py-2.5 btn-primary rounded-lg"
      >
        {loading ? 'Setting up…' : 'Launch Sizzle →'}
      </button>
    </form>
  )
}

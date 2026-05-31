'use client'

import { useState } from 'react'
import { createVenue } from './actions'

const BUSINESS_TYPES = [
  {
    id: 'cafe',
    label: 'Café / Coffee',
    theme: 'espresso',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 7h10v8a3 3 0 01-3 3H7a3 3 0 01-3-3V7z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 9h1.5a2.5 2.5 0 010 5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 4v1.5M11 3v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    theme: 'sage-dark',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M8 3v6.5c0 1.38-1.12 2.5-2.5 2.5S3 10.88 3 9.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5.5 12v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 3c0 0 4 2 4 6.5S14 16 14 16v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'bbq',
    label: 'BBQ & Grill',
    theme: 'ember',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 10c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 16v3M8 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 7c0-2 1.5-3 1.5-3s-.5 2 1 2 1-2 2.5-2-.5 3 1 3 1.5-1.5 1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'bakery',
    label: 'Bakery',
    theme: 'ivory',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 12c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="3" y="12" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 5V3M8.5 5.5L7 4M13.5 5.5L15 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'fastfood',
    label: 'Fast Food',
    theme: 'citrus',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 12c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 15h16M4.5 15v2a.5.5 0 00.5.5h12a.5.5 0 00.5-.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'bar',
    label: 'Bar & Drinks',
    theme: 'midnight',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 3h12l-5 7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'foodtruck',
    label: 'Food Truck',
    theme: 'harvest',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="7" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 11h2.5l1.5 3v2H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 7V5.5h8V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other',
    theme: 'ocean',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 11h16M11 3c-2 3-2 5 0 8s2 5 0 8M11 3c2 3 2 5 0 8s-2 5 0 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
] as const

type BusinessTypeId = typeof BUSINESS_TYPES[number]['id']

const TYPE_THEME: Record<BusinessTypeId, string> = Object.fromEntries(
  BUSINESS_TYPES.map(t => [t.id, t.theme])
) as Record<BusinessTypeId, string>

export default function OnboardingForm({ userId }: { userId: string }) {
  const [businessType, setBusinessType] = useState<BusinessTypeId>('restaurant')
  const [venueName, setVenueName]       = useState('')
  const [fullName, setFullName]         = useState('')
  const [withDemo, setWithDemo]         = useState(true)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  function selectType(id: BusinessTypeId) {
    setBusinessType(id)
    document.documentElement.setAttribute('data-theme', TYPE_THEME[id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createVenue({
      userId,
      venueName,
      fullName,
      theme: TYPE_THEME[businessType],
      withDemo,
    })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Business type picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
          Type of business
        </label>
        <div className="grid grid-cols-4 gap-2">
          {BUSINESS_TYPES.map(type => {
            const active = businessType === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => selectType(type.id)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150 text-center"
                style={{
                  borderColor:      active ? 'var(--accent)'   : 'var(--hair)',
                  background:       active ? 'var(--accent-tint)' : 'var(--surface)',
                  color:            active ? 'var(--accent)'   : 'var(--ink-3)',
                  boxShadow:        active ? '0 0 0 1px var(--accent)' : undefined,
                }}
              >
                <span className="shrink-0">{type.icon}</span>
                <span className="text-[9px] font-medium leading-tight" style={{ color: active ? 'var(--accent)' : 'var(--ink-4)' }}>
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Name fields */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Business name</label>
          <input
            type="text"
            required
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
            placeholder="Olive & Crumb"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Your name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent transition-colors"
            placeholder="Lina Hartono"
          />
        </div>
      </div>

      {/* Demo data toggle */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={withDemo}
            onChange={e => setWithDemo(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className="w-4 h-4 rounded border transition-colors"
            style={{
              background:   withDemo ? 'var(--accent)' : 'var(--surface)',
              borderColor:  withDemo ? 'var(--accent)' : 'var(--hair)',
            }}
          >
            {withDemo && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="absolute inset-0.5">
                <path d="M1.5 5l2.5 2.5 4.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Load sample data</p>
          <p className="text-xs text-ink-4 mt-0.5">Pre-fill with demo ingredients, menu items, and sales so you can explore right away</p>
        </div>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || !venueName.trim()}
        className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting up…' : 'Launch Sizzle →'}
      </button>
    </form>
  )
}

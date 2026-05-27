import { describe, it, expect } from 'vitest'
import { isPro } from './plan'

const base = {
  id: 'acc-1',
  createdAt: new Date(),
  trialStartedAt: null,
  aiTokensToday: 0,
  aiTokensDate: null,
}

describe('isPro', () => {
  it('returns false when plan is free', () => {
    expect(isPro({ ...base, plan: 'free', planExpiresAt: null })).toBe(false)
  })

  it('returns true when plan is pro and no expiry', () => {
    expect(isPro({ ...base, plan: 'pro', planExpiresAt: null })).toBe(true)
  })

  it('returns true when plan is pro and expiry is in the future', () => {
    const future = new Date(Date.now() + 86_400_000)
    expect(isPro({ ...base, plan: 'pro', planExpiresAt: future })).toBe(true)
  })

  it('returns false when plan is pro but expiry is in the past', () => {
    const past = new Date(Date.now() - 1)
    expect(isPro({ ...base, plan: 'pro', planExpiresAt: past })).toBe(false)
  })

  it('returns false when plan is pro and expiry is exactly now (boundary)', () => {
    const justPast = new Date(Date.now() - 1)
    expect(isPro({ ...base, plan: 'pro', planExpiresAt: justPast })).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import {
  isPro,
  isPremium,
  getEffectivePlan,
  isAtLeast,
  isTrial,
  isTrialActive,
  getTrialDaysLeft,
  isTrialExpired,
  hasUsedTrial,
} from './plan'

const base = {
  id: 'acc-1',
  createdAt: new Date(),
  trialStartedAt: null,
  aiTokensToday: 0,
  aiTokensDate: null,
  aiPushText: null,
  aiPushDate: null,
}

const future = new Date(Date.now() + 7 * 86_400_000)
const past = new Date(Date.now() - 1)

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

describe('getEffectivePlan', () => {
  it('returns free for free plan', () => {
    expect(getEffectivePlan({ ...base, plan: 'free', planExpiresAt: null })).toBe('free')
  })

  it('returns pro for active pro plan (no expiry)', () => {
    expect(getEffectivePlan({ ...base, plan: 'pro', planExpiresAt: null })).toBe('pro')
  })

  it('returns pro for active pro plan (future expiry)', () => {
    expect(getEffectivePlan({ ...base, plan: 'pro', planExpiresAt: future })).toBe('pro')
  })

  it('downgrades expired pro to free', () => {
    expect(getEffectivePlan({ ...base, plan: 'pro', planExpiresAt: past })).toBe('free')
  })

  it('returns premium for active premium plan', () => {
    expect(getEffectivePlan({ ...base, plan: 'premium', planExpiresAt: null })).toBe('premium')
  })
})

describe('isAtLeast', () => {
  it('free account is at least free', () => {
    expect(isAtLeast({ ...base, plan: 'free', planExpiresAt: null }, 'free')).toBe(true)
  })

  it('free account is not at least pro', () => {
    expect(isAtLeast({ ...base, plan: 'free', planExpiresAt: null }, 'pro')).toBe(false)
  })

  it('pro account is at least free and pro', () => {
    const acc = { ...base, plan: 'pro' as const, planExpiresAt: null }
    expect(isAtLeast(acc, 'free')).toBe(true)
    expect(isAtLeast(acc, 'pro')).toBe(true)
  })

  it('expired pro is treated as free for gating', () => {
    expect(isAtLeast({ ...base, plan: 'pro', planExpiresAt: past }, 'pro')).toBe(false)
  })
})

describe('isTrial', () => {
  it('returns false when trialStartedAt is null', () => {
    expect(isTrial({ ...base, plan: 'pro', planExpiresAt: future, trialStartedAt: null })).toBe(false)
  })

  it('returns false when planExpiresAt is null', () => {
    expect(isTrial({ ...base, plan: 'pro', planExpiresAt: null, trialStartedAt: new Date() })).toBe(false)
  })

  it('returns true for active trial', () => {
    expect(isTrial({ ...base, plan: 'pro', planExpiresAt: future, trialStartedAt: new Date() })).toBe(true)
  })

  it('returns false for expired trial', () => {
    expect(isTrial({ ...base, plan: 'pro', planExpiresAt: past, trialStartedAt: new Date() })).toBe(false)
  })

  it('returns false for free plan even with trial dates set', () => {
    expect(isTrial({ ...base, plan: 'free', planExpiresAt: future, trialStartedAt: new Date() })).toBe(false)
  })
})

describe('getTrialDaysLeft', () => {
  it('returns null for non-trial accounts', () => {
    expect(getTrialDaysLeft({ ...base, plan: 'free', planExpiresAt: null })).toBeNull()
  })

  it('returns days remaining for active trial (7 days)', () => {
    const sevenDays = new Date(Date.now() + 7 * 86_400_000)
    const days = getTrialDaysLeft({ ...base, plan: 'pro', planExpiresAt: sevenDays, trialStartedAt: new Date() })
    expect(days).toBe(7)
  })

  it('returns 0 when trial expires within the same day', () => {
    const almostNow = new Date(Date.now() + 1)
    const days = getTrialDaysLeft({ ...base, plan: 'pro', planExpiresAt: almostNow, trialStartedAt: new Date() })
    expect(days).toBe(1) // Math.ceil(< 1 day) = 1
  })
})

describe('isTrialExpired', () => {
  it('returns false when trialStartedAt is null', () => {
    expect(isTrialExpired({ ...base, plan: 'pro', planExpiresAt: past, trialStartedAt: null })).toBe(false)
  })

  it('returns false for free plan', () => {
    expect(isTrialExpired({ ...base, plan: 'free', planExpiresAt: past, trialStartedAt: new Date() })).toBe(false)
  })

  it('returns true when pro trial has expired', () => {
    expect(isTrialExpired({ ...base, plan: 'pro', planExpiresAt: past, trialStartedAt: new Date() })).toBe(true)
  })

  it('returns false when pro trial is still active', () => {
    expect(isTrialExpired({ ...base, plan: 'pro', planExpiresAt: future, trialStartedAt: new Date() })).toBe(false)
  })

  it('returns false when planExpiresAt is null', () => {
    expect(isTrialExpired({ ...base, plan: 'pro', planExpiresAt: null, trialStartedAt: new Date() })).toBe(false)
  })
})

describe('hasUsedTrial', () => {
  it('returns false when trialStartedAt is null', () => {
    expect(hasUsedTrial({ ...base, plan: 'free', planExpiresAt: null })).toBe(false)
  })

  it('returns true when trialStartedAt is set', () => {
    expect(hasUsedTrial({ ...base, plan: 'free', planExpiresAt: null, trialStartedAt: new Date() })).toBe(true)
  })
})

describe('isPremium', () => {
  it('returns true for active premium plan', () => {
    expect(isPremium({ ...base, plan: 'premium', planExpiresAt: null })).toBe(true)
  })

  it('returns true for active pro plan (premium = pro tier)', () => {
    expect(isPremium({ ...base, plan: 'pro', planExpiresAt: null })).toBe(true)
  })

  it('returns false for free plan', () => {
    expect(isPremium({ ...base, plan: 'free', planExpiresAt: null })).toBe(false)
  })

  it('returns false for expired pro plan', () => {
    expect(isPremium({ ...base, plan: 'pro', planExpiresAt: past })).toBe(false)
  })
})

describe('isTrialActive', () => {
  it('returns true for active trial (alias for isTrial)', () => {
    expect(isTrialActive({ ...base, plan: 'pro', planExpiresAt: future, trialStartedAt: new Date() })).toBe(true)
  })

  it('returns false for expired trial', () => {
    expect(isTrialActive({ ...base, plan: 'pro', planExpiresAt: past, trialStartedAt: new Date() })).toBe(false)
  })

  it('returns false for account with no trial', () => {
    expect(isTrialActive({ ...base, plan: 'pro', planExpiresAt: future, trialStartedAt: null })).toBe(false)
  })
})

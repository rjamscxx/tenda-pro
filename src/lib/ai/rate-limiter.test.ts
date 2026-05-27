import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, _resetRateLimitMap } from './rate-limiter'

beforeEach(() => _resetRateLimitMap())

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    expect(checkRateLimit('venue-1')).toBe(true)
  })

  it('allows up to the limit', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit('venue-1')).toBe(true)
    }
  })

  it('blocks the request beyond the limit', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('venue-1')
    expect(checkRateLimit('venue-1')).toBe(false)
  })

  it('isolates counts per venue', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('venue-1')
    expect(checkRateLimit('venue-1')).toBe(false)
    expect(checkRateLimit('venue-2')).toBe(true)
  })

  it('resets after the window expires', () => {
    const t0 = Date.now()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('venue-1', t0)
    expect(checkRateLimit('venue-1', t0)).toBe(false)
    // simulate window expiry
    expect(checkRateLimit('venue-1', t0 + RATE_LIMIT_WINDOW_MS + 1)).toBe(true)
  })
})

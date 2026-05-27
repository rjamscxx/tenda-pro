const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export const RATE_LIMIT_MAX = 20
export const RATE_LIMIT_WINDOW_MS = 60_000

export function checkRateLimit(venueId: string, now = Date.now()): boolean {
  const entry = rateLimitMap.get(venueId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(venueId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export function _resetRateLimitMap() {
  rateLimitMap.clear()
}

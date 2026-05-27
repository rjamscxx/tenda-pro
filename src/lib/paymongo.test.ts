import { describe, it, expect, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { verifyWebhookSignature } from './paymongo'

const SECRET = 'whsec_test_secret'

function makeSignature(body: string, timestamp: string, secret = SECRET): string {
  const hash = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},te=${hash},li=${hash}`
}

beforeEach(() => {
  process.env.PAYMONGO_WEBHOOK_SECRET = SECRET
})

describe('verifyWebhookSignature', () => {
  it('returns true for a valid signature', () => {
    const body = JSON.stringify({ data: { attributes: { type: 'checkout_session.payment.paid' } } })
    const sig = makeSignature(body, '1234567890')
    expect(verifyWebhookSignature(body, sig)).toBe(true)
  })

  it('returns false when signature is tampered', () => {
    const body = JSON.stringify({ data: {} })
    const sig = makeSignature(body, '1234567890')
    expect(verifyWebhookSignature(body + 'x', sig)).toBe(false)
  })

  it('returns false when timestamp is missing', () => {
    const body = '{}'
    expect(verifyWebhookSignature(body, 'te=abc123')).toBe(false)
  })

  it('returns false when te is missing', () => {
    const body = '{}'
    expect(verifyWebhookSignature(body, 't=1234567890')).toBe(false)
  })

  it('returns false with wrong secret', () => {
    const body = '{}'
    const sig = makeSignature(body, '1234567890', 'wrong_secret')
    expect(verifyWebhookSignature(body, sig)).toBe(false)
  })

  it('throws when PAYMONGO_WEBHOOK_SECRET is not set', () => {
    delete process.env.PAYMONGO_WEBHOOK_SECRET
    expect(() => verifyWebhookSignature('{}', 't=123,te=abc')).toThrow('PAYMONGO_WEBHOOK_SECRET is not set')
  })
})

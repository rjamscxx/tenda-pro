import { createHmac, timingSafeEqual } from 'crypto'

const PAYMONGO_BASE = 'https://api.paymongo.com/v1'

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set')
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

export const PLAN_AMOUNTS = {
  pro_monthly: 1000,   // ₱10/mo (test)
  pro_annual:  30000,  // ₱300/yr (test)
}

export async function createCheckoutSession(opts: {
  email: string
  accountId: string
  billing: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const key = opts.billing === 'annual' ? 'pro_annual' : 'pro_monthly'
  const amount = PLAN_AMOUNTS[key]
  const label = opts.billing === 'annual' ? 'Tenda Pro (Annual)' : 'Tenda Pro (Monthly)'
  const description = opts.billing === 'annual'
    ? 'Annual subscription — all Pro features (₱4,000/year, save ₱788)'
    : 'Monthly subscription — all Pro features (test)'

  const res = await fetch(`${PAYMONGO_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          billing: { email: opts.email },
          line_items: [{
            currency: 'PHP',
            amount,
            name: label,
            description,
            quantity: 1,
          }],
          payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay', 'billease', 'dob'],
          success_url: opts.successUrl,
          cancel_url: opts.cancelUrl,
          metadata: { account_id: opts.accountId },
          send_email_receipt: true,
          statement_descriptor: 'Tenda Pro',
          description: `${label} Subscription`,
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`PayMongo error: ${JSON.stringify(err)}`)
  }

  const json = await res.json() as { data: { attributes: { checkout_url: string } } }
  return json.data.attributes.checkout_url
}

// Reject webhooks older than this to prevent replay attacks
const WEBHOOK_TOLERANCE_SECONDS = 300 // 5 minutes

export function verifyWebhookSignature(rawBody: string, sigHeader: string): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret) throw new Error('PAYMONGO_WEBHOOK_SECRET is not set')

  // Header format: t=<timestamp>,te=<hmac>,li=<hmac>
  const parts: Record<string, string> = {}
  sigHeader.split(',').forEach(part => {
    const idx = part.indexOf('=')
    if (idx > 0) parts[part.slice(0, idx)] = part.slice(idx + 1)
  })

  const timestamp = parts['t']
  const signature = parts['te']
  if (!timestamp || !signature) return false

  // Reject stale timestamps before doing any HMAC work
  const tsSeconds = Number(timestamp)
  if (!Number.isFinite(tsSeconds)) return false
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - tsSeconds)
  if (ageSeconds > WEBHOOK_TOLERANCE_SECONDS) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  // Constant-time compare to prevent timing attacks
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

// Derives plan + subscription duration from the amount actually paid.
// Used by the webhook to set the correct expiry without trusting client metadata.
export function planForAmount(amount: number): { plan: 'pro'; days: number } | null {
  if (amount === PLAN_AMOUNTS.pro_monthly) return { plan: 'pro', days: 30 }
  if (amount === PLAN_AMOUNTS.pro_annual)  return { plan: 'pro', days: 365 }
  return null
}

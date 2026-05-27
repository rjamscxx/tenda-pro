import { createHmac } from 'crypto'

const PAYMONGO_BASE = 'https://api.paymongo.com/v1'

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set')
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

// Amount in centavos (e.g. 149900 = ₱1,499)
export const PAYMONGO_AMOUNT = parseInt(process.env.PAYMONGO_PRICE_CENTAVOS ?? '149900', 10)

export async function createCheckoutSession(opts: {
  email: string
  accountId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
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
            amount: PAYMONGO_AMOUNT,
            name: 'Sizzle Pro',
            description: 'Monthly subscription — all Pro features',
            quantity: 1,
          }],
          payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay', 'billease', 'dob'],
          success_url: opts.successUrl,
          cancel_url: opts.cancelUrl,
          metadata: { account_id: opts.accountId },
          send_email_receipt: true,
          statement_descriptor: 'Sizzle Pro',
          description: 'Sizzle Pro Monthly Subscription',
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

export function verifyWebhookSignature(rawBody: string, sigHeader: string): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret) throw new Error('PAYMONGO_WEBHOOK_SECRET is not set')

  // Header format: t=<timestamp>,te=<hmac>,li=<hmac>
  const parts: Record<string, string> = {}
  sigHeader.split(',').forEach(part => {
    const idx = part.indexOf('=')
    parts[part.slice(0, idx)] = part.slice(idx + 1)
  })

  const timestamp = parts['t']
  const signature = parts['te']
  if (!timestamp || !signature) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  return expected === signature
}

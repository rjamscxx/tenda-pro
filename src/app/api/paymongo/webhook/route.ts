import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, planForAmount } from '@/lib/paymongo'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

interface PayMongoEvent {
  data: {
    id?: string
    attributes: {
      type: string
      data: {
        attributes: {
          status: string
          line_items?: { amount: number; quantity: number }[]
          metadata?: { account_id?: string }
        }
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('paymongo-signature') ?? ''

  try {
    if (!verifyWebhookSignature(body, sig)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch (err) {
    console.error('[paymongo/webhook] sig error', err)
    return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 })
  }

  let event: PayMongoEvent
  try {
    event = JSON.parse(body) as PayMongoEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = event.data.attributes.type
  const session = event.data.attributes.data.attributes
  const accountId = session.metadata?.account_id

  if (type === 'checkout_session.payment.paid' && accountId) {
    // Derive plan from the amount actually paid (don't trust client metadata)
    const paidAmount = (session.line_items ?? []).reduce(
      (sum, li) => sum + li.amount * li.quantity,
      0,
    )
    const plan = planForAmount(paidAmount)
    if (!plan) {
      console.error('[paymongo/webhook] unknown amount', { paidAmount, accountId })
      return NextResponse.json({ error: 'Unknown plan amount' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Idempotency: only update if the new expiry is later than what's there.
    // PayMongo retries on 5xx — this prevents double-extension on retries
    // while still letting a real second payment extend the cycle.
    await db.update(accounts)
      .set({ plan, planExpiresAt: expiresAt, trialStartedAt: null })
      .where(eq(accounts.id, accountId))
  }

  return NextResponse.json({ received: true })
}

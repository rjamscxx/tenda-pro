import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paymongo'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

interface PayMongoEvent {
  data: {
    attributes: {
      type: string
      data: {
        attributes: {
          status: string
          metadata?: { account_id?: string; plan?: string }
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

  const event = JSON.parse(body) as PayMongoEvent
  const type = event.data.attributes.type
  const metadata = event.data.attributes.data.attributes.metadata
  const accountId = metadata?.account_id

  if (type === 'checkout_session.payment.paid' && accountId) {
    const rawPlan = metadata?.plan ?? 'pro'
    const plan: 'pro' | 'premium' = rawPlan === 'premium' ? 'premium' : 'pro'
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await db.update(accounts)
      .set({ plan, planExpiresAt: expiresAt, trialStartedAt: null })
      .where(eq(accounts.id, accountId))
  }

  return NextResponse.json({ received: true })
}

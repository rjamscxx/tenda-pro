import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/paymongo'
import { requireVenue } from '@/lib/queries/auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST() {
  const { account, authUser } = await requireVenue()

  try {
    const url = await createCheckoutSession({
      email: authUser.email ?? '',
      accountId: account.id,
      successUrl: `${APP_URL}/settings?upgraded=1#plan`,
      cancelUrl: `${APP_URL}/settings#plan`,
    })
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[paymongo/checkout]', err)
    return NextResponse.json({ error: 'Payment provider unavailable' }, { status: 503 })
  }
}

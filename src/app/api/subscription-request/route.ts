import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { fullName, phone, email, billing, receiptUrl } = await req.json() as {
    fullName: string
    phone: string
    email: string
    billing: 'monthly' | 'annual'
    receiptUrl?: string
  }

  if (!fullName || !phone || !email || !billing) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const planLabel = billing === 'annual' ? 'Pro Annual — ₱4,000/yr' : 'Pro Monthly — ₱399/mo'

  const html = `
    <h2>New Sizzle Subscription Request</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><strong>Plan</strong></td><td>${planLabel}</td></tr>
      <tr><td><strong>Full Name</strong></td><td>${fullName}</td></tr>
      <tr><td><strong>Contact Number</strong></td><td>${phone}</td></tr>
      <tr><td><strong>Email</strong></td><td>${email}</td></tr>
      ${receiptUrl ? `<tr><td><strong>Receipt</strong></td><td><a href="${receiptUrl}">${receiptUrl}</a></td></tr>` : ''}
    </table>
    <p style="margin-top:16px;color:#666;font-size:13px">
      Activate their account via <code>activatePlan('pro')</code> once payment is confirmed.
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: 'rjamscxx@gmail.com',
    replyTo: email,
    subject: `[Sizzle] Subscription request — ${fullName} (${planLabel})`,
    html,
  })

  if (error) {
    console.error('[subscription-request]', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

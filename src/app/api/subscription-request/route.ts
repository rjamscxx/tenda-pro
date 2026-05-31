import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Save to DB — this is the source of truth, email is best-effort
  const supabase = createAdminClient()
  const { error: dbError } = await supabase
    .from('subscription_requests')
    .insert({ full_name: fullName, phone, email, billing, receipt_url: receiptUrl ?? null })

  if (dbError) {
    console.error('[subscription-request] db error:', dbError.message)
    return NextResponse.json({ error: 'Could not save request' }, { status: 500 })
  }

  // Try email — failure is non-fatal, request is already saved
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
      Check Supabase → subscription_requests table, then activate via activatePlan('pro').
    </p>
  `
  const { error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: 'rjamscxx@gmail.com',
    replyTo: email,
    subject: `[Sizzle] Subscription request — ${fullName} (${planLabel})`,
    html,
  })
  if (emailError) {
    // Non-fatal — request is saved in DB
    console.warn('[subscription-request] email failed (non-fatal):', JSON.stringify(emailError))
  }

  return NextResponse.json({ ok: true })
}

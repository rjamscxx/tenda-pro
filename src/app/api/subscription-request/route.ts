import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { ADMIN_EMAIL } from '@/lib/admin'

const SubReqSchema = z.object({
  fullName:   z.string().trim().min(1).max(120),
  phone:      z.string().trim().min(5).max(40),
  email:      z.string().trim().email().max(254),
  billing:    z.enum(['monthly', 'annual']),
  receiptUrl: z.string().url().max(2048).optional().nullable(),
})

// Minimal HTML escape — Resend's HTML body is rendered by email clients;
// raw interpolation lets a request body inject markup into the email.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  // Auth: signed-in users only. Prevents anonymous DB-fill + inbox spam.
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SubReqSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const { fullName, phone, email, billing, receiptUrl } = parsed.data

  // Source of truth = DB. Email is best-effort.
  const admin = createAdminClient()
  const { error: dbError } = await admin
    .from('subscription_requests')
    .insert({ full_name: fullName, phone, email, billing, receipt_url: receiptUrl ?? null })
  if (dbError) {
    console.error('[subscription-request] db error:', dbError.message)
    return NextResponse.json({ error: 'Could not save request' }, { status: 500 })
  }

  const planLabel = billing === 'annual' ? 'Pro Annual — ₱4,000/yr' : 'Pro Monthly — ₱399/mo'
  const html = `
    <h2>New Tenda Subscription Request</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><strong>Plan</strong></td><td>${esc(planLabel)}</td></tr>
      <tr><td><strong>Full Name</strong></td><td>${esc(fullName)}</td></tr>
      <tr><td><strong>Contact Number</strong></td><td>${esc(phone)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(email)}</td></tr>
      ${receiptUrl ? `<tr><td><strong>Receipt</strong></td><td><a href="${esc(receiptUrl)}">${esc(receiptUrl)}</a></td></tr>` : ''}
    </table>
    <p style="margin-top:16px;color:#666;font-size:13px">
      Check Supabase → subscription_requests, or activate from Settings → Subscription Requests.
    </p>
  `
  const { error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[Tenda] Subscription request — ${fullName} (${planLabel})`,
    html,
  })
  if (emailError) {
    console.warn('[subscription-request] email failed (non-fatal):', JSON.stringify(emailError))
  }

  return NextResponse.json({ ok: true })
}

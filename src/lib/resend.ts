import nodemailer, { type Transporter } from 'nodemailer'

// Email via Brevo SMTP. Replaces Resend, which could not send: Resend's free
// tier requires a verified sender *domain*, and we only have a gmail address +
// a parked sizzle.app — so every send 403'd ("domain is not verified"). Brevo
// is already verified to send from rjamscxx@gmail.com (same account Courtside
// uses). This keeps the old Resend call shape — `resend.emails.send({ from,
// to, subject, html })` returning `{ data, error }` — so callers are unchanged.
// (File name kept as resend.ts only to avoid churn; it is Brevo under the hood.)

const SENDER_EMAIL = process.env.BREVO_SENDER || 'rjamscxx@gmail.com'
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Sizzle'

// Lazy transport — created on first send so the build never constructs it.
let _tx: Transporter | null = null
function transport(): Transporter {
  if (!_tx) {
    _tx = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // STARTTLS on 587
      auth: {
        user: process.env.BREVO_SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASS || '',
      },
    })
  }
  return _tx
}

// Pull a bare email out of a "Name <email>" string, else return as-is.
function bareAddr(s?: string): string {
  if (!s) return SENDER_EMAIL
  const m = s.match(/<([^>]+)>/)
  return (m ? m[1] : s).trim()
}

type SendArgs = {
  from?: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  reply_to?: string
  replyTo?: string
}
type SendResult = { data: { id: string } | null; error: { message: string } | null }

async function send(args: SendArgs): Promise<SendResult> {
  if (!process.env.BREVO_SMTP_PASS) {
    return { data: null, error: { message: 'Email not configured (BREVO_SMTP_PASS missing)' } }
  }
  try {
    const info = await transport().sendMail({
      // Always the verified Brevo sender — Brevo rejects unverified senders.
      from: { name: SENDER_NAME, address: SENDER_EMAIL },
      to: Array.isArray(args.to) ? args.to.join(', ') : args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: bareAddr(args.reply_to || args.replyTo || args.from) || undefined,
    })
    return { data: { id: info.messageId }, error: null }
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e) } }
  }
}

// Drop-in for the old Resend client.
export const resend = { emails: { send } }
export const FROM_EMAIL = SENDER_EMAIL
export const isResendConfigured = () => !!process.env.BREVO_SMTP_PASS
export const isEmailConfigured = isResendConfigured

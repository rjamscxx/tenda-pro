import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { accounts, sales, expenses, users, venues, dailyDigests } from '@/lib/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FROM    = process.env.RESEND_FROM     ?? 'Sizzle <digest@mail.sizzle.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sizzle.app'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPeso(cents: number) {
  const abs = Math.abs(cents)
  return '₱' + (abs / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function yesterdayManila() {
  // Manila is UTC+8; cron fires at 18:00 UTC = 02:00 Manila → recap for "yesterday Manila"
  const nowUTC = Date.now()
  const manilaMs = 8 * 3600 * 1000
  const yesterdayManilaDate = new Date(nowUTC + manilaMs - 86400000)
  const dateStr = yesterdayManilaDate.toISOString().slice(0, 10) // YYYY-MM-DD
  const start = new Date(`${dateStr}T00:00:00+08:00`)
  const end   = new Date(`${dateStr}T23:59:59.999+08:00`)
  const dayLabel = new Date(`${dateStr}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
  })
  return { dateStr, start, end, dayLabel }
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildHtml(p: {
  venueName: string
  dayLabel:  string
  revenue:   number
  exp:       number
  profit:    number
  margin:    number | null
  saleCount: number
  dashUrl:   string
}) {
  const pc = p.profit >= 0 ? '#34D399' : '#F87171'
  const noData = p.revenue === 0 && p.exp === 0
  const kpis = noData ? '' : `
  <tr>
    <td style="padding:16px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:32%;padding:16px 10px;background:rgba(255,255,255,0.05);border-radius:10px;text-align:center;vertical-align:top;">
          <p style="margin:0 0 8px;font-size:10px;color:#6B8A7E;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">Revenue</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#E8F5EF;">${fmtPeso(p.revenue)}</p>
          <p style="margin:5px 0 0;font-size:11px;color:#6B8A7E;">${p.saleCount} sale${p.saleCount !== 1 ? 's' : ''}</p>
        </td>
        <td style="width:4px;"></td>
        <td style="width:32%;padding:16px 10px;background:rgba(255,255,255,0.05);border-radius:10px;text-align:center;vertical-align:top;">
          <p style="margin:0 0 8px;font-size:10px;color:#6B8A7E;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">Expenses</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#E8F5EF;">${fmtPeso(p.exp)}</p>
        </td>
        <td style="width:4px;"></td>
        <td style="width:32%;padding:16px 10px;background:rgba(255,255,255,0.05);border-radius:10px;text-align:center;vertical-align:top;">
          <p style="margin:0 0 8px;font-size:10px;color:#6B8A7E;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">Profit</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:${pc};">${p.profit < 0 ? '−' : ''}${fmtPeso(p.profit)}</p>
          ${p.margin !== null ? `<p style="margin:5px 0 0;font-size:11px;color:${pc};">${p.margin.toFixed(1)}%</p>` : ''}
        </td>
      </tr></table>
    </td>
  </tr>`

  const quiet = noData ? `
  <tr><td style="padding:16px 28px 32px;">
    <p style="margin:0;font-size:14px;color:#6B8A7E;text-align:center;padding:20px 0;">Quiet day — no sales or expenses logged.</p>
  </td></tr>` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sizzle Daily Digest</title></head>
<body style="margin:0;padding:0;background:#0E1714;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1714;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#121F1A;border:1px solid rgba(88,192,152,0.2);border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:26px 28px 22px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:18px;font-weight:700;color:#58C098;letter-spacing:-0.4px;">Sizzle</span>
      <p style="margin:3px 0 0;font-size:13px;color:#6B8A7E;">${p.venueName} &middot; Daily Digest</p>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 28px 4px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#C8E0D4;">Yesterday</p>
      <p style="margin:3px 0 0;font-size:13px;color:#6B8A7E;">${p.dayLabel}</p>
    </td>
  </tr>
  ${kpis}${quiet}
  <tr>
    <td style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:12px;color:#6B8A7E;">
        Sent automatically by <strong style="color:#8A9E96;">Sizzle</strong> &nbsp;&middot;&nbsp;
        <a href="${p.dashUrl}" style="color:#58C098;text-decoration:none;">Open dashboard &rarr;</a>
      </p>
    </td>
  </tr>
</table>
</td></tr></table>
</body></html>`
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Authenticate cron caller (Vercel sends Authorization: Bearer CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { dateStr, start, end, dayLabel } = yesterdayManila()

  // Get all Pro venues + owner user IDs
  const allVenues = await db
    .select({ venue: venues, plan: accounts.plan })
    .from(venues)
    .innerJoin(accounts, eq(accounts.id, venues.accountId))
  const proVenues = allVenues.filter(r => r.plan === 'pro').map(r => r.venue)
  if (proVenues.length === 0) return NextResponse.json({ sent: 0 })

  // Get owner records (userId → venueId via accountId)
  const allOwners = await db.select().from(users).where(eq(users.role, 'owner'))
  const ownersByAccount = new Map<string, string>() // accountId → userId
  for (const u of allOwners) ownersByAccount.set(u.accountId, u.id)

  // Get auth user emails via admin client
  const adminClient = createAdminClient()
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailByAuthId = new Map<string, string>()
  for (const au of authData?.users ?? []) {
    if (au.email) emailByAuthId.set(au.id, au.email)
  }

  let sent = 0
  const errors: string[] = []

  for (const venue of proVenues) {
    const ownerId = ownersByAccount.get(venue.accountId)
    if (!ownerId) continue
    const email = emailByAuthId.get(ownerId)
    if (!email) continue

    // Compute yesterday's metrics
    const [daySales, dayExpenses] = await Promise.all([
      db.select({ total: sales.total })
        .from(sales)
        .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, start), lt(sales.soldAt, end))),
      db.select({ amount: expenses.amount })
        .from(expenses)
        .where(and(eq(expenses.venueId, venue.id), eq(expenses.expensedAt, dateStr))),
    ])

    const revenue   = daySales.reduce((s, r) => s + r.total, 0)
    const exp       = dayExpenses.reduce((s, r) => s + r.amount, 0)
    const profit    = revenue - exp
    const margin    = revenue > 0 ? (profit / revenue) * 100 : null
    const saleCount = daySales.length

    // Store digest snapshot
    await db.insert(dailyDigests).values({
      venueId:    venue.id,
      date:       dateStr,
      digestJson: { revenue, expenses: exp, profit, margin, saleCount, dayLabel },
    }).onConflictDoNothing()

    const html = buildHtml({
      venueName: venue.name,
      dayLabel,
      revenue, exp, profit, margin, saleCount,
      dashUrl: APP_URL + '/dashboard',
    })

    const subject = revenue > 0
      ? `${venue.name} made ${fmtPeso(revenue)} yesterday`
      : `Sizzle daily digest — ${dayLabel}`

    const { error } = await resend.emails.send({
      from:    FROM,
      to:      email,
      subject,
      html,
    })

    if (error) {
      errors.push(`${venue.name}: ${error.message}`)
    } else {
      sent++
    }
  }

  return NextResponse.json({ sent, date: dateStr, errors: errors.length ? errors : undefined })
}

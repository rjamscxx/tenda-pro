'use server'

import { requireVenue } from '@/lib/queries/auth'
import { getTodayKpi } from '@/lib/queries/todayKpi'
import { db } from '@/lib/db'
import { sales, saleItems, expenses, wasteLogs, dishes } from '@/lib/db/schema'
import { and, eq, sql, desc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'

function formatPHP(cents: number) {
  return `₱${(cents/100).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}

export async function emailCloseOut() {
  const { venue } = await requireVenue()
  if (!process.env.RESEND_API_KEY) {
    return { error: 'Email not configured. Set RESEND_API_KEY first.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const toEmail = user?.email
  if (!toEmail) return { error: 'No email on file for the current user.' }

  const k = await getTodayKpi(venue.id)
  const today = k.today
  const todayStart = new Date(`${today}T00:00:00+08:00`)
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000)
  const todayStartIso = todayStart.toISOString()
  const tomorrowStartIso = tomorrowStart.toISOString()

  const [topSellers, todayExpRows, todayWasteRows, openTabs] = await Promise.all([
    db.select({
      dishName: dishes.name,
      qty:      sql<string>`sum(${saleItems.qty})::int`,
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
      .where(and(
        eq(sales.venueId, venue.id),
        sql`${sales.soldAt} >= ${todayStartIso}`,
        sql`${sales.soldAt} <  ${tomorrowStartIso}`,
      ))
      .groupBy(dishes.name)
      .orderBy(desc(sql`sum(${saleItems.qty})`))
      .limit(5),
    db.select({ category: expenses.category, amount: expenses.amount, vendor: expenses.vendor })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), eq(expenses.expensedAt, today))),
    db.select({ ingredientName: wasteLogs.ingredientName, qty: wasteLogs.qty, unit: wasteLogs.unit, estimatedCost: wasteLogs.estimatedCost })
      .from(wasteLogs)
      .where(and(eq(wasteLogs.venueId, venue.id), eq(wasteLogs.wastedAt, today)))
      .catch(() => [] as Array<{ ingredientName: string; qty: string; unit: string; estimatedCost: number }>),
    db.select({ id: sales.id, total: sales.total, customerName: sales.customerName })
      .from(sales)
      .where(and(
        eq(sales.venueId, venue.id), eq(sales.isPaid, false),
        sql`${sales.soldAt} >= ${todayStartIso}`,
        sql`${sales.soldAt} <  ${tomorrowStartIso}`,
      )),
  ])

  const dateLabel = new Date(`${today}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;background:#f4f0e7;padding:24px;color:#1a2420;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d8d2c6;">
    <div style="padding:24px 28px;border-bottom:1px solid #ede8de;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#636f6b;font-weight:600;">Tenda Pro · close of day</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#1a2420;letter-spacing:-0.01em;">${venue.name}</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#4c5d57;">${dateLabel}</p>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#4c5d57;">Revenue</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1f5f4a;font-variant-numeric:tabular-nums;">${formatPHP(k.revenue)}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5d57;">Food cost (COGS)</td><td style="padding:6px 0;text-align:right;color:#1a2420;font-variant-numeric:tabular-nums;">− ${formatPHP(k.cogs)}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5d57;">Other expenses</td><td style="padding:6px 0;text-align:right;color:#1a2420;font-variant-numeric:tabular-nums;">− ${formatPHP(k.expenses)}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5d57;">Waste</td><td style="padding:6px 0;text-align:right;color:#1a2420;font-variant-numeric:tabular-nums;">− ${formatPHP(k.waste)}</td></tr>
        <tr><td colspan="2" style="padding:0;border-top:1px solid #ede8de;"></td></tr>
        <tr><td style="padding:10px 0;font-weight:700;color:#1a2420;">Net profit</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:18px;color:${k.net >= 0 ? '#1f5f4a' : '#b2492e'};font-variant-numeric:tabular-nums;">${formatPHP(k.net)}</td></tr>
      </table>
      <p style="margin:20px 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#636f6b;font-weight:600;">Top sellers</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${topSellers.map(t => `<tr><td style="padding:4px 0;color:#1a2420;">${t.dishName}</td><td style="padding:4px 0;text-align:right;color:#4c5d57;font-variant-numeric:tabular-nums;">×${t.qty}</td></tr>`).join('')}
      </table>
      ${openTabs.length > 0 ? `
        <p style="margin:20px 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#875800;font-weight:700;">⚠ ${openTabs.length} unpaid ${openTabs.length === 1 ? 'tab' : 'tabs'}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${openTabs.map(t => `<tr><td style="padding:4px 0;color:#1a2420;">${t.customerName ?? '—'}</td><td style="padding:4px 0;text-align:right;color:#875800;font-weight:600;font-variant-numeric:tabular-nums;">${formatPHP(t.total)}</td></tr>`).join('')}
        </table>
      ` : ''}
      ${todayExpRows.length > 0 ? `
        <p style="margin:20px 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#636f6b;font-weight:600;">Expenses today (${todayExpRows.length})</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${todayExpRows.map(e => `<tr><td style="padding:4px 0;color:#1a2420;">${e.category}${e.vendor ? ` · ${e.vendor}` : ''}</td><td style="padding:4px 0;text-align:right;color:#4c5d57;font-variant-numeric:tabular-nums;">${formatPHP(e.amount)}</td></tr>`).join('')}
        </table>
      ` : ''}
      ${todayWasteRows.length > 0 ? `
        <p style="margin:20px 0 6px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#636f6b;font-weight:600;">Waste today</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${todayWasteRows.map(w => `<tr><td style="padding:4px 0;color:#1a2420;">${w.ingredientName} · ${w.qty}${w.unit.toUpperCase()}</td><td style="padding:4px 0;text-align:right;color:#4c5d57;font-variant-numeric:tabular-nums;">${formatPHP(w.estimatedCost)}</td></tr>`).join('')}
        </table>
      ` : ''}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #ede8de;text-align:center;">
      <p style="margin:0;font-size:11px;color:#636f6b;">Sent by <a href="https://tenda.ph" style="color:#1f5f4a;text-decoration:none;font-weight:600;">Tenda Pro</a></p>
    </div>
  </div>
</body></html>`

  const subject = `${venue.name} · close of day ${dateLabel} · net ${formatPHP(k.net)}`
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to:   [toEmail],
    subject,
    html,
  })
  if (error) {
    console.error('emailCloseOut Resend error:', error)
    return { error: error.message || 'Failed to send.' }
  }
  return { ok: true, to: toEmail }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { venues, users, accounts, sales, expenses, ingredients } from '@/lib/db/schema'
import { and, eq, gte, lt, lte, sum, count, sql, inArray } from 'drizzle-orm'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Format cents to Philippine Peso string: 123456 -> "1,234.56"
function formatPeso(cents: number): string {
  return (cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format a date for display: "Wednesday, May 28, 2026"
function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

function buildDigestHtml(params: {
  venueName: string
  dateLabel: string
  salesTotal: number
  expensesTotal: number
  lowStockItems: Array<{ name: string; stockQty: string; lowStockThreshold: string; unit: string }>
}): string {
  const { venueName, dateLabel, salesTotal, expensesTotal, lowStockItems } = params
  const netProfit = salesTotal - expensesTotal
  const netColor = netProfit >= 0 ? '#16a34a' : '#dc2626'

  const lowStockSection =
    lowStockItems.length === 0
      ? ''
      : `
    <div style="margin-top: 24px; padding: 16px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #9a3412;">Low Stock Items</p>
      <ul style="margin: 0; padding-left: 18px; color: #7c2d12; font-size: 13px;">
        ${lowStockItems
          .map(
            (item) =>
              `<li style="margin-bottom: 4px;"><strong>${item.name}</strong> — ${parseFloat(item.stockQty).toFixed(2)} ${item.unit} remaining (threshold: ${parseFloat(item.lowStockThreshold).toFixed(2)} ${item.unit})</li>`
          )
          .join('')}
      </ul>
    </div>`

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 4px;">Daily Summary</h1>
  <p style="color: #666; font-size: 14px; margin-top: 0;">${dateLabel} &middot; ${venueName}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 12px 16px; background: #f9fafb; border-radius: 6px; width: 33%;">
        <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Sales</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">&#8369;${formatPeso(salesTotal)}</p>
      </td>
      <td style="padding: 12px 16px; background: #f9fafb; border-radius: 6px; width: 33%;">
        <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Expenses</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">&#8369;${formatPeso(expensesTotal)}</p>
      </td>
      <td style="padding: 12px 16px; background: #f9fafb; border-radius: 6px; width: 33%;">
        <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Net Profit</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: ${netColor};">&#8369;${formatPeso(netProfit)}</p>
      </td>
    </tr>
  </table>

  ${lowStockSection}

  <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0 16px 0;">
  <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
    Sent by Sizzle &mdash; your all-in-one restaurant dashboard.
  </p>
</div>`.trim()
}

export async function GET(req: NextRequest) {
  // Auth check — identical pattern to existing crons
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[daily-digest] RESEND_API_KEY is not set — skipping email sends')
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_api_key' })
  }

  // Yesterday's boundaries in Philippine Standard Time (UTC+8)
  const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const todayManilaStr = nowManila.toLocaleDateString('en-CA') // YYYY-MM-DD

  // Build UTC timestamps for "yesterday" in Manila time
  // Manila midnight today in UTC = today's Manila date at 00:00 PHT = yesterday UTC+8 day boundary
  const [y, m, d] = todayManilaStr.split('-').map(Number)
  // Manila 00:00 today in UTC
  const todayManilaStartUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 8 * 60 * 60 * 1000)
  // Manila 00:00 yesterday in UTC
  const yesterdayManilaStartUtc = new Date(todayManilaStartUtc.getTime() - 24 * 60 * 60 * 1000)

  const yesterdayDateStr = yesterdayManilaStartUtc.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const dateLabel = formatDateLong(yesterdayManilaStartUtc)

  // Find all venues that had at least one sale OR expense yesterday
  const venuesWithSales = await db
    .selectDistinct({ venueId: sales.venueId })
    .from(sales)
    .where(and(gte(sales.soldAt, yesterdayManilaStartUtc), lt(sales.soldAt, todayManilaStartUtc)))

  const venuesWithExpenses = await db
    .selectDistinct({ venueId: expenses.venueId })
    .from(expenses)
    .where(and(eq(expenses.expensedAt, yesterdayDateStr)))

  // Deduplicate venue IDs
  const activeVenueIds = Array.from(
    new Set([
      ...venuesWithSales.map((r) => r.venueId),
      ...venuesWithExpenses.map((r) => r.venueId),
    ])
  )

  if (activeVenueIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_activity_yesterday' })
  }

  // Load venue + account info for active venues
  const venueRows = await db
    .select({ venue: venues, account: accounts })
    .from(venues)
    .innerJoin(accounts, eq(accounts.id, venues.accountId))
    .where(inArray(venues.id, activeVenueIds))

  // Get owner user IDs (role = 'owner') for each account
  const accountIds = venueRows.map((r) => r.account.id)
  const ownerRows = await db
    .select({ accountId: users.accountId, userId: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, 'owner'),
        inArray(users.accountId, accountIds)
      )
    )

  // Build accountId -> userId map
  const accountToOwner = new Map<string, string>()
  for (const row of ownerRows) {
    accountToOwner.set(row.accountId, row.userId)
  }

  // Fetch emails from Supabase auth for all owner user IDs
  const supabaseAdmin = createAdminClient()
  const ownerUserIds = Array.from(new Set(ownerRows.map((r) => r.userId)))

  const userIdToEmail = new Map<string, string>()
  for (const userId of ownerUserIds) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!error && data.user?.email) {
      userIdToEmail.set(userId, data.user.email)
    }
  }

  let sent = 0

  for (const { venue, account } of venueRows) {
    const ownerId = accountToOwner.get(account.id)
    const ownerEmail = ownerId ? userIdToEmail.get(ownerId) : undefined

    if (!ownerEmail) {
      console.warn(`[daily-digest] No owner email found for venue ${venue.id} (${venue.name}) — skipping`)
      continue
    }

    // Aggregate yesterday's sales total for this venue
    const [salesAgg] = await db
      .select({ total: sum(sales.total) })
      .from(sales)
      .where(
        and(
          eq(sales.venueId, venue.id),
          gte(sales.soldAt, yesterdayManilaStartUtc),
          lt(sales.soldAt, todayManilaStartUtc)
        )
      )

    // Aggregate yesterday's expenses total for this venue
    const [expensesAgg] = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), eq(expenses.expensedAt, yesterdayDateStr)))

    const salesTotal = Number(salesAgg?.total ?? 0)
    const expensesTotal = Number(expensesAgg?.total ?? 0)

    // Fetch low stock items for this venue
    const lowStockItems = await db
      .select({
        name: ingredients.name,
        stockQty: ingredients.stockQty,
        lowStockThreshold: ingredients.lowStockThreshold,
        unit: ingredients.unit,
      })
      .from(ingredients)
      .where(
        and(
          eq(ingredients.venueId, venue.id),
          sql`${ingredients.stockQty}::numeric <= ${ingredients.lowStockThreshold}::numeric`,
          sql`${ingredients.lowStockThreshold}::numeric > 0`
        )
      )

    const html = buildDigestHtml({
      venueName: venue.name,
      dateLabel,
      salesTotal,
      expensesTotal,
      lowStockItems,
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `Your Sizzle Summary for ${yesterdayDateStr}`,
      html,
    })

    if (error) {
      console.error(`[daily-digest] Failed to send email for venue ${venue.id}:`, error)
    } else {
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}

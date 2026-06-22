import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accounts, users, venues, sales, expenses, saleItems, dishes, ingredients } from '@/lib/db/schema'
import { and, eq, gte, lt, desc, sql, isNotNull } from 'drizzle-orm'
import { isPro as isPremium } from '@/lib/plan'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Helper: PHP cents → "₱1,234" string
const peso = (cents: number) => '₱' + (Math.round(cents) / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })

interface DigestData {
  venueName: string
  today: string
  revenue: number
  transactionCount: number
  expenses: number
  netPnl: number
  yesterdayRevenue: number
  topDish: { name: string; qty: number; revenue: number } | null
  lowStock: { name: string; unit: string; stock: number }[]
  outOfStock: { name: string; unit: string }[]
  foodCostPct: number | null
}

function renderDigestHtml(d: DigestData): string {
  const deltaTxt = d.yesterdayRevenue > 0
    ? (() => {
        const pct = ((d.revenue - d.yesterdayRevenue) / d.yesterdayRevenue) * 100
        return `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}% vs yesterday`
      })()
    : 'first day of tracking'

  const profitColor = d.netPnl >= 0 ? '#22c55e' : '#ef4444'

  const lowStockRows = [...d.outOfStock.map(i => ({ name: i.name, label: `out of stock` })), ...d.lowStock.map(i => ({ name: i.name, label: `${i.stock.toFixed(0)} ${i.unit} left` }))]
    .slice(0, 6)
    .map(i => `<tr><td style="padding:6px 0;color:#f59e0b;font-size:13px">⚠ ${i.name}</td><td style="padding:6px 0;text-align:right;color:#6b7280;font-size:12px">${i.label}</td></tr>`)
    .join('')

  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#141414;border:1px solid #262626;border-radius:16px;overflow:hidden">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #262626">
          <p style="margin:0;color:#a3a3a3;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Daily digest · ${d.today}</p>
          <h1 style="margin:6px 0 0;color:#fafafa;font-size:20px;font-weight:600;letter-spacing:-0.02em">${d.venueName}</h1>
        </td></tr>

        <tr><td style="padding:28px">

          <!-- Revenue block -->
          <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:14px">
            <p style="margin:0;color:#a3a3a3;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Revenue today</p>
            <p style="margin:6px 0 4px;color:#fafafa;font-size:28px;font-weight:700;letter-spacing:-0.02em">${peso(d.revenue)}</p>
            <p style="margin:0;color:#737373;font-size:12px">${d.transactionCount} transaction${d.transactionCount === 1 ? '' : 's'} · ${deltaTxt}</p>
          </div>

          <!-- KPI row -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
            <tr>
              <td width="48%" style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;vertical-align:top">
                <p style="margin:0;color:#a3a3a3;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Expenses</p>
                <p style="margin:4px 0 0;color:#fafafa;font-size:18px;font-weight:600">${peso(d.expenses)}</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;vertical-align:top">
                <p style="margin:0;color:#a3a3a3;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Net P&L</p>
                <p style="margin:4px 0 0;color:${profitColor};font-size:18px;font-weight:700">${d.netPnl < 0 ? '−' : ''}${peso(Math.abs(d.netPnl))}</p>
              </td>
            </tr>
          </table>

          ${d.foodCostPct !== null ? `
          <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:14px">
            <p style="margin:0;color:#a3a3a3;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Food cost % MTD</p>
            <p style="margin:4px 0 0;color:${d.foodCostPct > 40 ? '#f59e0b' : '#fafafa'};font-size:18px;font-weight:600">${d.foodCostPct.toFixed(1)}%</p>
          </div>` : ''}

          ${d.topDish ? `
          <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:14px">
            <p style="margin:0 0 8px;color:#a3a3a3;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Top seller today</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#fafafa;font-size:14px;font-weight:500">${d.topDish.name}</td>
                <td style="color:#737373;font-size:12px;text-align:right">${d.topDish.qty}× · ${peso(d.topDish.revenue)}</td>
              </tr>
            </table>
          </div>` : ''}

          ${lowStockRows ? `
          <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px">
            <p style="margin:0 0 8px;color:#a3a3a3;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Needs attention</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lowStockRows}</table>
          </div>` : ''}

        </td></tr>

        <tr><td style="padding:20px 28px;background:#0a0a0a;border-top:1px solid #262626;text-align:center">
          <a href="https://tenda.ph/dashboard" style="display:inline-block;background:#fafafa;color:#0a0a0a;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600">Open dashboard →</a>
          <p style="margin:14px 0 0;color:#525252;font-size:11px">Premium digest · Tenda Pro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 'RESEND_API_KEY not set' })
  }

  // Resolve venue emails via Supabase Admin (auth.users has the email).
  // Service role key is required for this read.
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supaUrl || !supaServiceKey) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 'Supabase admin not configured' })
  }
  const supabaseAdmin = createSupabaseAdmin(supaUrl, supaServiceKey, { auth: { persistSession: false } })

  // Pull all Premium accounts with at least one venue and a known user
  const rows = await db
    .select({
      accountId:    accounts.id,
      plan:         accounts.plan,
      planExpiresAt: accounts.planExpiresAt,
      userId:       users.id,
      venueId:      venues.id,
      venueName:    venues.name,
      tz:           venues.timezone,
      foodCostTarget: venues.foodCostTarget,
    })
    .from(accounts)
    .innerJoin(users,  eq(users.accountId, accounts.id))
    .innerJoin(venues, eq(venues.accountId, accounts.id))
    .where(isNotNull(accounts.plan))

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    // Filter to Premium only (use the same isPremium logic that gates the UI)
    if (!isPremium({ plan: row.plan, planExpiresAt: row.planExpiresAt } as Parameters<typeof isPremium>[0])) {
      skipped++
      continue
    }

    const tz = row.tz || 'Asia/Manila'
    const now = new Date()
    const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const todayStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate())
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const monthStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1)
    const todayStr      = todayStart.toLocaleDateString('en-CA', { timeZone: tz })
    const monthStartStr = monthStart.toLocaleDateString('en-CA', { timeZone: tz })

    try {
      // Get email from auth.users
      const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(row.userId)
      const email = userInfo?.user?.email
      if (!email) { skipped++; continue }

      // Sales today + yesterday + counts
      const [salesAgg] = await db.select({
        todayRevenue:     sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${todayStart.toISOString()} and ${sales.soldAt} < ${tomorrowStart.toISOString()} then ${sales.total}::bigint else 0 end), 0)`,
        todayCount:       sql<string>`count(case when ${sales.soldAt} >= ${todayStart.toISOString()} and ${sales.soldAt} < ${tomorrowStart.toISOString()} then 1 end)`,
        yesterdayRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${yesterdayStart.toISOString()} and ${sales.soldAt} < ${todayStart.toISOString()} then ${sales.total}::bigint else 0 end), 0)`,
      }).from(sales).where(and(eq(sales.venueId, row.venueId), gte(sales.soldAt, yesterdayStart)))

      // Expenses today + ingredient cost MTD
      const [expAgg] = await db.select({
        today:           sql<string>`coalesce(sum(case when ${expenses.expensedAt} = ${todayStr} then ${expenses.amount}::bigint else 0 end), 0)`,
        ingredientsMtd:  sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'ingredients' then ${expenses.amount}::bigint else 0 end), 0)`,
      }).from(expenses).where(and(eq(expenses.venueId, row.venueId), gte(expenses.expensedAt, monthStartStr)))

      // Revenue MTD
      const [revMtdAgg] = await db.select({
        revMtd: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      }).from(sales).where(and(eq(sales.venueId, row.venueId), gte(sales.soldAt, monthStart)))

      // Top dish today
      const topRows = await db
        .select({
          dishName: dishes.name,
          totalQty: sql<string>`sum(${saleItems.qty})`,
          totalRevenue: sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})`,
        })
        .from(saleItems)
        .innerJoin(sales,  eq(saleItems.saleId, sales.id))
        .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
        .where(and(eq(sales.venueId, row.venueId), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart)))
        .groupBy(dishes.name)
        .orderBy(desc(sql`sum(${saleItems.qty})`))
        .limit(1)

      // Low stock + out of stock
      const allIngredients = await db.select({
        name: ingredients.name,
        unit: ingredients.unit,
        stockQty: ingredients.stockQty,
        lowStockThreshold: ingredients.lowStockThreshold,
      }).from(ingredients).where(eq(ingredients.venueId, row.venueId))

      const outOfStock: { name: string; unit: string }[] = []
      const lowStock: { name: string; unit: string; stock: number }[] = []
      for (const i of allIngredients) {
        const stock = parseFloat(i.stockQty)
        const threshold = parseFloat(i.lowStockThreshold)
        if (stock <= 0) outOfStock.push({ name: i.name, unit: i.unit })
        else if (threshold > 0 && stock <= threshold) lowStock.push({ name: i.name, unit: i.unit, stock })
      }

      const revenue = Number(salesAgg.todayRevenue)
      const yesterdayRevenue = Number(salesAgg.yesterdayRevenue)
      const expensesToday = Number(expAgg.today)
      const ingredientCostMonth = Number(expAgg.ingredientsMtd)
      const revMonth = Number(revMtdAgg.revMtd)
      const foodCostPct = revMonth > 0 ? (ingredientCostMonth / revMonth) * 100 : null

      // Only send if there was activity today (revenue OR an expense) — otherwise the
      // digest is noise.
      if (revenue === 0 && expensesToday === 0) {
        skipped++
        continue
      }

      const digest: DigestData = {
        venueName:        row.venueName,
        today:            new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }),
        revenue,
        transactionCount: Number(salesAgg.todayCount),
        expenses:         expensesToday,
        netPnl:           revenue - expensesToday,
        yesterdayRevenue,
        topDish:          topRows.length > 0 ? { name: topRows[0].dishName, qty: Number(topRows[0].totalQty), revenue: Number(topRows[0].totalRevenue) } : null,
        lowStock,
        outOfStock,
        foodCostPct,
      }

      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: `${row.venueName} — ${peso(revenue)} today`,
        html:    renderDigestHtml(digest),
      })
      sent++
    } catch (err) {
      console.error(`[daily-digest] account=${row.accountId} venue=${row.venueId}`, err)
      errors.push(`${row.venueId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors: errors.slice(0, 5) })
}

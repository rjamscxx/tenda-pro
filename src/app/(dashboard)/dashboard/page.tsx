import { db } from '@/lib/db'
import { sales, expenses, ingredients, saleItems, dishes, wasteLogs, dailyDigests } from '@/lib/db/schema'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { formatCurrency } from '@/lib/utils'
import DashboardClient from './DashboardClient'
import CashflowChart, { type ChartPoint } from './CashflowChart'
import EodSummary from './EodSummary'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — Sizzle' }

function greet(tz: string) {
  const h = parseInt(
    new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
  )
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function delta(current: number, previous: number) {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  return { pct, up: pct >= 0 }
}

export default async function DashboardPage() {
  const { venue } = await requireVenue()
  const tz = venue.timezone

  // ── Date helpers ──────────────────────────────────────────────────────────
  const nowLocal      = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const todayStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate())
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const monthStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1)
  const lastMonthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth() - 1, 1)
  const monthStartStr = monthStart.toLocaleDateString('en-CA')

  const thirtyDaysAgo = new Date(todayStart); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA')

  // ── Queries ────────────────────────────────────────────────────────────────
  const todayDateStr = todayStart.toLocaleDateString('en-CA')

  const yesterdayStr = yesterdayStart.toLocaleDateString('en-CA')

  const [
    todaySalesRows, yesterdaySalesRows, monthSalesRows, lastMonthSalesRows,
    monthIngredientRows, monthExpenseRows, allIngredients,
    chartSalesRows, chartExpensesRows, topDishesRows,
    todayTxCountRows, todayExpenseRows, todayWasteRows, digestRows,
  ] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${sales.total}), 0)` })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart))),

    db.select({ total: sql<string>`coalesce(sum(${sales.total}), 0)` })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, yesterdayStart), lt(sales.soldAt, todayStart))),

    db.select({ total: sql<string>`coalesce(sum(${sales.total}), 0)` })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, monthStart))),

    db.select({ total: sql<string>`coalesce(sum(${sales.total}), 0)` })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, lastMonthStart), lt(sales.soldAt, monthStart))),

    db.select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), eq(expenses.category, 'ingredients'), gte(expenses.expensedAt, monthStartStr))),

    db.select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, monthStartStr))),

    db.select({ id: ingredients.id, name: ingredients.name, unit: ingredients.unit, stockQty: ingredients.stockQty, lowStockThreshold: ingredients.lowStockThreshold })
      .from(ingredients)
      .where(eq(ingredients.venueId, venue.id)),

    db.select({ soldAt: sales.soldAt, total: sales.total })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, thirtyDaysAgo))),

    db.select({ expensedAt: expenses.expensedAt, amount: expenses.amount })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, thirtyDaysAgoStr))),

    db.select({
      dishId:       saleItems.dishId,
      dishName:     dishes.name,
      totalQty:     sql<string>`sum(${saleItems.qty})::text`,
      totalRevenue: sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})::text`,
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart)))
      .groupBy(saleItems.dishId, dishes.name)
      .orderBy(desc(sql`sum(${saleItems.qty})`))
      .limit(5),

    db.select({ count: sql<string>`count(*)::text` })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart))),

    db.select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), eq(expenses.expensedAt, todayDateStr))),

    db.select({ total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)` })
      .from(wasteLogs)
      .where(and(eq(wasteLogs.venueId, venue.id), eq(wasteLogs.wastedAt, todayDateStr))),

    db.select({ digestJson: dailyDigests.digestJson, date: dailyDigests.date })
      .from(dailyDigests)
      .where(and(eq(dailyDigests.venueId, venue.id), eq(dailyDigests.date, yesterdayStr)))
      .limit(1),
  ])

  type DigestJson = { revenue: number; expenses: number; profit: number; margin: number | null; saleCount: number; dayLabel: string }
  const digest = (digestRows[0]?.digestJson ?? null) as DigestJson | null

  // ── KPI calculations ───────────────────────────────────────────────────────
  const revenueToday       = Number(todaySalesRows[0].total)
  const revenueYesterday   = Number(yesterdaySalesRows[0].total)
  const revenueMonth       = Number(monthSalesRows[0].total)
  const revenueLastMonth   = Number(lastMonthSalesRows[0].total)
  const ingredientCostMonth = Number(monthIngredientRows[0].total)
  const totalExpensesMonth  = Number(monthExpenseRows[0].total)

  const todayDelta = delta(revenueToday, revenueYesterday)
  const monthDelta = delta(revenueMonth, revenueLastMonth)

  const todayTransactionCount = Number(todayTxCountRows[0].count)
  const todayExpenses         = Number(todayExpenseRows[0].total)
  const todayWaste            = Number(todayWasteRows[0].total)

  const dailyTarget    = venue.dailyRevenueTarget > 0
    ? venue.dailyRevenueTarget
    : venue.monthlyRevenueGoal > 0 ? Math.round(venue.monthlyRevenueGoal / 26) : 0
  const dailyTargetPct = dailyTarget > 0 ? Math.min((revenueToday / dailyTarget) * 100, 100) : null
  const dailyTargetMet = revenueToday >= dailyTarget && dailyTarget > 0

  const outOfStock    = allIngredients.filter(i => parseFloat(i.stockQty) <= 0)
  const lowStock      = allIngredients.filter(
    i => parseFloat(i.stockQty) > 0 && parseFloat(i.lowStockThreshold) > 0 &&
         parseFloat(i.stockQty) <= parseFloat(i.lowStockThreshold)
  )
  const lowStockCount = outOfStock.length + lowStock.length

  const foodCostPct    = revenueMonth > 0 ? (ingredientCostMonth / revenueMonth) * 100 : null
  const grossMarginPct = revenueMonth > 0 ? ((revenueMonth - ingredientCostMonth) / revenueMonth) * 100 : null

  // Budget progress
  const revenueGoal   = venue.monthlyRevenueGoal   // cents
  const expenseBudget = venue.monthlyExpenseBudget  // cents
  const revGoalPct    = revenueGoal > 0 ? Math.min((revenueMonth / revenueGoal) * 100, 100) : null
  const expBudgetPct  = expenseBudget > 0 ? Math.min((totalExpensesMonth / expenseBudget) * 100, 100) : null
  const overBudget    = expenseBudget > 0 && totalExpensesMonth > expenseBudget

  // ── 30-day chart data ──────────────────────────────────────────────────────
  const revMap = new Map<string, number>()
  for (const row of chartSalesRows) {
    const day = new Date(row.soldAt).toLocaleDateString('en-CA', { timeZone: tz })
    revMap.set(day, (revMap.get(day) ?? 0) + Number(row.total))
  }
  const expMap = new Map<string, number>()
  for (const row of chartExpensesRows) {
    expMap.set(row.expensedAt, (expMap.get(row.expensedAt) ?? 0) + Number(row.amount))
  }
  const chartData: ChartPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo); d.setDate(d.getDate() + i)
    const date = d.toLocaleDateString('en-CA')
    return { date, revenue: Math.round((revMap.get(date) ?? 0) / 100), expenses: Math.round((expMap.get(date) ?? 0) / 100) }
  })

  // ── KPI card definitions ───────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Revenue Today',
      value: formatCurrency(revenueToday),
      sub: revenueMonth > 0 ? `${formatCurrency(revenueMonth)} this month` : 'no sales yet this month',
      delta: todayDelta,
      deltaLabel: 'vs yesterday',
      status: 'neutral' as const,
    },
    {
      label: 'Month Revenue',
      value: formatCurrency(revenueMonth),
      sub: revenueLastMonth > 0 ? `${formatCurrency(revenueLastMonth)} last month` : 'first month tracked',
      delta: monthDelta,
      deltaLabel: 'vs last month',
      status: 'neutral' as const,
    },
    {
      label: 'Food Cost %',
      value: foodCostPct !== null ? `${foodCostPct.toFixed(1)}%` : '—',
      sub: 'ingredients vs revenue MTD',
      delta: null,
      deltaLabel: '',
      status: foodCostPct !== null && foodCostPct > (venue.foodCostTarget ?? 35) ? 'warn' as const : 'good' as const,
    },
    {
      label: 'Gross Margin',
      value: grossMarginPct !== null ? `${grossMarginPct.toFixed(1)}%` : '—',
      sub: 'after ingredient cost MTD',
      delta: null,
      deltaLabel: '',
      status: grossMarginPct !== null && grossMarginPct < 30 ? 'warn' as const : 'neutral' as const,
    },
  ]

  const todayStr = new Date().toLocaleDateString('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
  })

  // ── Context-aware AI suggestions ──────────────────────────────────────────
  const aiSuggestions: string[] = []
  if (lowStockCount > 0)
    aiSuggestions.push(`What ingredients are running low? (${lowStockCount} item${lowStockCount !== 1 ? 's' : ''})`)
  const foodCostThreshold = venue.foodCostTarget ?? 35
  if (foodCostPct !== null && foodCostPct > foodCostThreshold)
    aiSuggestions.push(`Why is my food cost at ${foodCostPct.toFixed(1)}% this month?`)
  if (revenueToday === 0)
    aiSuggestions.push("I have no sales today — what should I check?")
  else
    aiSuggestions.push("What was my revenue today?")
  if (aiSuggestions.length < 4)
    aiSuggestions.push("What are my top-selling dishes this week?")
  if (aiSuggestions.length < 4)
    aiSuggestions.push("Show me this month's profit summary")

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">

      {/* Header */}
      <div className="card-enter card-d0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink tracking-tight">{greet(tz)}</h1>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" title="Live" />
          </div>
          <p className="text-sm text-ink-4 mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EodSummary
            venueName={venue.name}
            revenueToday={revenueToday}
            expensesToday={todayExpenses}
            wasteToday={todayWaste}
            transactionCount={todayTransactionCount}
            topDishes={topDishesRows.map(d => ({
              dishName: d.dishName,
              totalQty: Number(d.totalQty),
              totalRevenue: Number(d.totalRevenue),
            }))}
            todayStr={todayStr}
          />
          <Link
            href="/sales?log=1"
            className="flex-1 sm:flex-none px-4 py-2 btn-primary rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Log Sale
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div key={kpi.label} className={`card-enter card-d${idx + 1} glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden`}>
            <div className={`absolute inset-x-0 top-0 h-[2px] ${
              kpi.status === 'warn' ? 'bg-warn' : kpi.status === 'good' ? 'bg-success' : 'bg-gradient-to-r from-accent via-accent-2 to-accent'
            }`} />
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-ink-4 uppercase tracking-widest">{kpi.label}</p>
              <span className={`w-1.5 h-1.5 rounded-full ${
                kpi.status === 'warn' ? 'bg-warn animate-pulse' : kpi.status === 'good' ? 'bg-success' : 'bg-hair-2'
              }`} />
            </div>
            <p className={`text-[1.65rem] font-bold tabular tracking-tight leading-none ${
              kpi.status === 'warn' ? 'text-warn' : 'text-ink'
            }`}>
              {kpi.value}
            </p>
            <div className="flex items-center justify-between gap-1 min-h-[16px]">
              <p className="text-[11px] text-ink-4 leading-snug">{kpi.sub}</p>
              {kpi.delta && (
                <span className={`text-[10px] font-semibold tabular shrink-0 px-1.5 py-0.5 rounded-md ${
                  kpi.delta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'
                }`}>
                  {kpi.delta.up ? '↑' : '↓'}{Math.abs(kpi.delta.pct).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {(revenueGoal > 0 || expenseBudget > 0) && (
        <div className="card-enter card-d3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {revenueGoal > 0 && revGoalPct !== null && (
            <div className="glass rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Revenue Goal</p>
                <span className="text-[11px] tabular text-ink-3">
                  {formatCurrency(revenueMonth)} / {formatCurrency(revenueGoal)}
                </span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${revGoalPct}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-4">
                {revGoalPct >= 100 ? 'Goal reached!' : `${revGoalPct.toFixed(0)}% of monthly goal`}
              </p>
            </div>
          )}
          {expenseBudget > 0 && expBudgetPct !== null && (
            <div className="glass rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Expense Budget</p>
                <span className={`text-[11px] tabular ${overBudget ? 'text-danger' : 'text-ink-3'}`}>
                  {formatCurrency(totalExpensesMonth)} / {formatCurrency(expenseBudget)}
                </span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-danger' : 'bg-success'}`}
                  style={{ width: `${expBudgetPct}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-4">
                {overBudget
                  ? `Over budget by ${formatCurrency(totalExpensesMonth - expenseBudget)}`
                  : `${(100 - expBudgetPct).toFixed(0)}% remaining`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Daily target progress */}
      {dailyTargetPct !== null && (
        <div className="card-enter card-d4 glass rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Today&apos;s Target</p>
            <span className="text-[11px] tabular text-ink-3">
              {formatCurrency(revenueToday)} / {formatCurrency(dailyTarget)}
            </span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${dailyTargetMet ? 'bg-success' : 'bg-accent'}`}
              style={{ width: `${dailyTargetPct}%` }}
            />
          </div>
          <p className="text-[10px] text-ink-4">
            {dailyTargetMet ? 'Daily target reached!' : `${dailyTargetPct.toFixed(0)}% of today's target`}
          </p>
        </div>
      )}

      {/* Needs Attention */}
      {(outOfStock.length > 0 || lowStock.length > 0 || (foodCostPct !== null && foodCostPct > foodCostThreshold + 5)) && (
        <div className="card-enter card-d3 rounded-xl border border-warn/30 bg-warn/5 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-warn shrink-0">
              <path d="M7 1L13 12H1L7 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M7 5.5v3M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="text-xs font-semibold text-warn uppercase tracking-widest">Needs Attention</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map(i => (
              <span key={i.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-danger/10 text-danger text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                {i.name} — out of stock
              </span>
            ))}
            {lowStock.map(i => (
              <span key={i.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warn/10 text-warn text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-warn shrink-0" />
                {i.name} — {parseFloat(i.stockQty) % 1 === 0 ? parseFloat(i.stockQty).toFixed(0) : parseFloat(i.stockQty).toFixed(2)} {i.unit} left
              </span>
            ))}
            {foodCostPct !== null && foodCostPct > foodCostThreshold + 5 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warn/10 text-warn text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-warn shrink-0" />
                Food cost at {foodCostPct.toFixed(1)}% — above {foodCostThreshold + 5}% target
              </span>
            )}
          </div>
        </div>
      )}

      {/* Yesterday's digest */}
      {digest && (
        <div className="card-enter card-d4 glass card-glow rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-accent shrink-0">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Yesterday&apos;s Recap</p>
            <span className="text-[11px] text-ink-4 ml-auto">{digest.dayLabel}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-surface-2 border border-hair px-3 py-2.5">
              <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">Revenue</p>
              <p className="text-base tabular font-semibold text-ink mt-1">{formatCurrency(digest.revenue)}</p>
              <p className="text-[10px] text-ink-4 mt-0.5">{digest.saleCount} sale{digest.saleCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-hair px-3 py-2.5">
              <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">Expenses</p>
              <p className="text-base tabular font-semibold text-ink mt-1">{formatCurrency(digest.expenses)}</p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-hair px-3 py-2.5">
              <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">Profit</p>
              <p className={`text-base tabular font-semibold mt-1 ${digest.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                {digest.profit < 0 ? '−' : ''}{formatCurrency(Math.abs(digest.profit))}
              </p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-hair px-3 py-2.5">
              <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">Margin</p>
              <p className={`text-base tabular font-semibold mt-1 ${digest.margin === null ? 'text-ink-4' : digest.margin >= 30 ? 'text-success' : digest.margin < 0 ? 'text-danger' : 'text-warn'}`}>
                {digest.margin !== null ? `${digest.margin.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart + AI row */}
      <div className="card-enter card-d5 grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Cashflow chart */}
        <div className="lg:col-span-3 glass card-glow rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">30-Day Cashflow</p>
              <p className="text-xs text-ink-4 mt-0.5">Revenue vs Expenses</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] rounded-full bg-accent inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] rounded-full bg-danger inline-block" />
                Expenses
              </span>
            </div>
          </div>
          <CashflowChart data={chartData} />
        </div>

        {/* Top sellers + AI chat */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {topDishesRows.length > 0 ? (
            <div className="glass card-glow rounded-xl p-4 space-y-3">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Today&apos;s Top Sellers</p>
              <div className="space-y-2.5">
                {topDishesRows.map((dish, i) => (
                  <div key={dish.dishId ?? i} className="flex items-center gap-2.5 group">
                    <span className={`text-[10px] font-bold w-4 tabular shrink-0 ${i === 0 ? 'text-accent' : 'text-ink-4'}`}>{i + 1}</span>
                    <span className="flex-1 text-[13px] text-ink truncate">{dish.dishName}</span>
                    <span className="text-[11px] tabular text-ink-4">{Number(dish.totalQty)}×</span>
                    <span className="text-[13px] tabular font-semibold text-accent">{formatCurrency(Number(dish.totalRevenue))}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-4 flex items-center justify-center text-sm text-ink-4">
              No sales logged today yet
            </div>
          )}
          <DashboardClient suggestions={aiSuggestions} />
        </div>
      </div>

      {/* Low stock summary */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between glass rounded-xl px-4 py-3 border-l-2 border-warn">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-warn shrink-0">
              <path d="M6.5 1.5L12 11H1L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M6.5 5v2.5M6.5 9.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-ink-3">
              <span className="text-warn font-semibold tabular">{lowStockCount}</span> ingredient{lowStockCount !== 1 ? 's' : ''} low or out of stock
            </span>
          </div>
          <Link href="/inventory" className="text-xs text-accent hover:text-accent font-medium flex items-center gap-1 group">
            View <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      )}
    </div>
  )
}

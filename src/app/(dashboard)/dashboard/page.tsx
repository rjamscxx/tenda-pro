import { db } from '@/lib/db'
import { sales, expenses, ingredients, saleItems, dishes, wasteLogs } from '@/lib/db/schema'
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { formatCurrency } from '@/lib/utils'
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

  // ── Queries (7 consolidated) ──────────────────────────────────────────────
  const todayDateStr = todayStart.toLocaleDateString('en-CA')

  const [salesAgg, expensesAgg, allIngredients, chartSalesRows, chartExpensesRows, topDishesRows, todayWasteRows, dishCountRows] = await Promise.all([
    // 1. All sales KPIs in one pass
    db.select({
      todayRevenue:     sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${todayStart} and ${sales.soldAt} < ${tomorrowStart} then ${sales.total}::bigint else 0 end), 0)`,
      todayCount:       sql<string>`count(case when ${sales.soldAt} >= ${todayStart} and ${sales.soldAt} < ${tomorrowStart} then 1 end)`,
      yesterdayRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${yesterdayStart} and ${sales.soldAt} < ${todayStart} then ${sales.total}::bigint else 0 end), 0)`,
      monthRevenue:     sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${monthStart} then ${sales.total}::bigint else 0 end), 0)`,
      lastMonthRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${lastMonthStart} and ${sales.soldAt} < ${monthStart} then ${sales.total}::bigint else 0 end), 0)`,
    }).from(sales).where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, lastMonthStart))),

    // 2. All expense KPIs in one pass
    db.select({
      ingredientCostMonth: sql<string>`coalesce(sum(case when ${expenses.category}::text = 'ingredients' then ${expenses.amount}::bigint else 0 end), 0)`,
      totalExpensesMonth:  sql<string>`coalesce(sum(${expenses.amount}::bigint), 0)`,
      todayExpenses:       sql<string>`coalesce(sum(case when ${expenses.expensedAt} = ${todayDateStr} then ${expenses.amount}::bigint else 0 end), 0)`,
    }).from(expenses).where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, monthStartStr))),

    // 3. Ingredients for low-stock check
    db.select({ id: ingredients.id, name: ingredients.name, unit: ingredients.unit, stockQty: ingredients.stockQty, lowStockThreshold: ingredients.lowStockThreshold })
      .from(ingredients).where(eq(ingredients.venueId, venue.id)),

    // 4. 30-day chart sales
    db.select({ soldAt: sales.soldAt, total: sales.total })
      .from(sales).where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, thirtyDaysAgo))),

    // 5. 30-day chart expenses
    db.select({ expensedAt: expenses.expensedAt, amount: expenses.amount })
      .from(expenses).where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, thirtyDaysAgoStr))),

    // 6. Today's top dishes
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

    // 7. Today's waste total
    db.select({ total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)` })
      .from(wasteLogs).where(and(eq(wasteLogs.venueId, venue.id), eq(wasteLogs.wastedAt, todayDateStr))),

    // 8. Getting-started: dish count (ingredients already in allIngredients)
    db.select({ c: count() }).from(dishes).where(eq(dishes.venueId, venue.id)),
  ])

  // ── KPI calculations ───────────────────────────────────────────────────────
  const revenueToday          = Number(salesAgg[0].todayRevenue)
  const revenueYesterday      = Number(salesAgg[0].yesterdayRevenue)
  const revenueMonth          = Number(salesAgg[0].monthRevenue)
  const revenueLastMonth      = Number(salesAgg[0].lastMonthRevenue)
  const ingredientCostMonth   = Number(expensesAgg[0].ingredientCostMonth)
  const totalExpensesMonth    = Number(expensesAgg[0].totalExpensesMonth)

  const todayDelta = delta(revenueToday, revenueYesterday)
  const monthDelta = delta(revenueMonth, revenueLastMonth)

  const todayTransactionCount = Number(salesAgg[0].todayCount)
  const todayExpenses         = Number(expensesAgg[0].todayExpenses)
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

  // ── Getting started checklist ─────────────────────────────────────────────
  const gettingStarted = [
    {
      key:  'ingredients',
      done: allIngredients.length > 0,
      title: 'Add ingredients',
      body:  'Enter the items you cook with and their unit costs.',
      href:  '/menu',
    },
    {
      key:  'dishes',
      done: dishCountRows[0].c > 0,
      title: 'Create your first dish',
      body:  'Build your menu and link ingredients to calculate food cost.',
      href:  '/menu',
    },
    {
      key:  'sale',
      done: revenueMonth > 0 || revenueLastMonth > 0,
      title: 'Log your first sale',
      body:  'Record a sale via the POS or the Sales page.',
      href:  '/pos',
    },
    {
      key:  'expense',
      done: totalExpensesMonth > 0,
      title: 'Log an expense',
      body:  'Track costs to start seeing your real profit margin.',
      href:  '/expenses',
    },
  ]
  const doneCount      = gettingStarted.filter(s => s.done).length
  const showChecklist  = doneCount < gettingStarted.length

  const todayStr = new Date().toLocaleDateString('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
  })

  const foodCostThreshold = venue.foodCostTarget ?? 35

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

      {/* ── Getting started checklist ──────────────────────────────────────── */}
      {showChecklist && (
        <div className="card-enter card-d1 glass rounded-xl border border-accent/20 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-hair flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-accent">
                  <path d="M2 6.5L5 9.5 11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-ink">Getting started</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {gettingStarted.map(s => (
                  <div
                    key={s.key}
                    className="w-5 h-1 rounded-full"
                    style={{ background: s.done ? 'var(--accent)' : 'var(--surface-3)' }}
                  />
                ))}
              </div>
              <span className="text-[11px] text-ink-4 tabular">{doneCount}/{gettingStarted.length}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="divide-y divide-hair">
            {gettingStarted.map((step, i) => (
              <div
                key={step.key}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  step.done ? 'opacity-50' : 'hover:bg-surface-2/40'
                }`}
              >
                {/* Check circle */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  step.done
                    ? 'border-accent bg-accent-dim'
                    : 'border-hair-2 bg-transparent'
                }`}>
                  {step.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L3.5 7 8.5 2.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {!step.done && (
                    <span className="text-[9px] font-bold text-ink-4">{i + 1}</span>
                  )}
                </div>

                {/* Copy */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${step.done ? 'text-ink-3 line-through' : 'text-ink'}`}>
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="text-[11px] text-ink-4 mt-0.5 leading-snug">{step.body}</p>
                  )}
                </div>

                {/* CTA */}
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 text-xs text-accent font-medium hover:underline flex items-center gap-1 group"
                  >
                    Go
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Chart + Top Sellers row */}
      <div className="card-enter card-d5 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Cashflow chart */}
        <div className="lg:col-span-2 glass card-glow rounded-xl p-5 flex flex-col gap-4">
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

        {/* Top sellers */}
        <div className="glass card-glow rounded-xl p-4 space-y-3">
          <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Today&apos;s Top Sellers</p>
          {topDishesRows.length > 0 ? (
            <div className="space-y-2.5">
              {topDishesRows.map((dish, i) => (
                <div key={dish.dishId ?? i} className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-bold w-4 tabular shrink-0 ${i === 0 ? 'text-accent' : 'text-ink-4'}`}>{i + 1}</span>
                  <span className="flex-1 text-[13px] text-ink truncate">{dish.dishName}</span>
                  <span className="text-[11px] tabular text-ink-4">{Number(dish.totalQty)}×</span>
                  <span className="text-[13px] tabular font-semibold text-accent">{formatCurrency(Number(dish.totalRevenue))}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-ink-4">
              No sales logged today yet
            </div>
          )}
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

import { db } from '@/lib/db'
import { sales, expenses, ingredients, saleItems, dishes, wasteLogs } from '@/lib/db/schema'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPremium } from '@/lib/plan'
import { canSeeFinancials } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils'
import CashflowChart, { type ChartPoint } from './CashflowChart'
import EodSummary from './EodSummary'
import AiTodayPush from '@/components/layout/AiTodayPush'
import Figure from '@/components/ui/Figure'
import { getOrGenerateTodayPush } from '@/lib/ai/todayPush'
import { refreshTodayPush } from './ai-actions'
import { getTodayChecklistSummary } from '../checklists/actions'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — Tenda Pro' }

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
  const { venue, account, dbUser } = await requireVenue()
  const premium = isPremium(account)
  const showFin = canSeeFinancials(dbUser)
  const tz = venue.timezone

  // ── Date helpers ──────────────────────────────────────────────────────────
  const nowLocal      = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const todayStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate())
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const monthStart    = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1)
  const lastMonthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth() - 1, 1)
  // YYYY-MM-DD strings are compared against PG `date` columns (expenses.expensedAt,
  // waste_logs.wastedAt) which store venue-local calendar dates. Always pass
  // {timeZone: tz} so the comparison is correct regardless of where the function runs.
  const monthStartStr     = monthStart.toLocaleDateString('en-CA', { timeZone: tz })
  const lastMonthStartStr = lastMonthStart.toLocaleDateString('en-CA', { timeZone: tz })

  const thirtyDaysAgo = new Date(todayStart); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA', { timeZone: tz })
  const sevenDaysAgo    = new Date(todayStart); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: tz })
  const yesterdayDateStr = yesterdayStart.toLocaleDateString('en-CA', { timeZone: tz })
  const daysFromMonday  = (nowLocal.getDay() + 6) % 7
  const weekStart       = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - daysFromMonday)
  const lastWeekStart   = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  // ── Queries (7 consolidated) ──────────────────────────────────────────────
  const todayDateStr = todayStart.toLocaleDateString('en-CA', { timeZone: tz })

  // Drizzle's sql`` template binds raw values without applying column type
  // transformers, and the postgres driver rejects bare Date params. Pre-serialize
  // the timestamp bounds we splice into sql`` templates below to ISO strings.
  const todayStartIso     = todayStart.toISOString()
  const tomorrowStartIso  = tomorrowStart.toISOString()
  const yesterdayStartIso = yesterdayStart.toISOString()
  const monthStartIso     = monthStart.toISOString()
  const lastMonthStartIso = lastMonthStart.toISOString()
  const weekStartIso      = weekStart.toISOString()
  const lastWeekStartIso  = lastWeekStart.toISOString()

  const [salesAgg, expensesAgg, allIngredients, chartSalesRows, chartExpensesRows, topDishesRows, anyDish, channelRows, weekAgg, cogsAgg] = await Promise.all([
    // 1. All sales KPIs in one pass
    db.select({
      todayRevenue:     sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${todayStartIso} and ${sales.soldAt} < ${tomorrowStartIso} then ${sales.total}::bigint else 0 end), 0)`,
      todayCount:       sql<string>`count(case when ${sales.soldAt} >= ${todayStartIso} and ${sales.soldAt} < ${tomorrowStartIso} then 1 end)`,
      yesterdayRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${yesterdayStartIso} and ${sales.soldAt} < ${todayStartIso} then ${sales.total}::bigint else 0 end), 0)`,
      monthRevenue:     sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${monthStartIso} then ${sales.total}::bigint else 0 end), 0)`,
      lastMonthRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${lastMonthStartIso} and ${sales.soldAt} < ${monthStartIso} then ${sales.total}::bigint else 0 end), 0)`,
    }).from(sales).where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, lastMonthStart))),

    // 2. All expense KPIs + per-category MTD in one pass
    db.select({
      ingredientCostMonth: sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'ingredients' then ${expenses.amount}::bigint else 0 end), 0)`,
      totalExpensesMonth:  sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} then ${expenses.amount}::bigint else 0 end), 0)`,
      lastMonthExpenses:   sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${lastMonthStartStr} and ${expenses.expensedAt} < ${monthStartStr} then ${expenses.amount}::bigint else 0 end), 0)`,
      todayExpenses:       sql<string>`coalesce(sum(case when ${expenses.expensedAt} = ${todayDateStr} then ${expenses.amount}::bigint else 0 end), 0)`,
      catLabor:            sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'labor'      then ${expenses.amount}::bigint else 0 end), 0)`,
      catRent:             sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'rent'       then ${expenses.amount}::bigint else 0 end), 0)`,
      catUtilities:        sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'utilities'  then ${expenses.amount}::bigint else 0 end), 0)`,
      catMarketing:        sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'marketing'  then ${expenses.amount}::bigint else 0 end), 0)`,
      catOther:            sql<string>`coalesce(sum(case when ${expenses.expensedAt} >= ${monthStartStr} and ${expenses.category}::text = 'other'      then ${expenses.amount}::bigint else 0 end), 0)`,
    }).from(expenses).where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, lastMonthStartStr))),

    // 3. Ingredients for low-stock check
    db.select({ id: ingredients.id, name: ingredients.name, unit: ingredients.unit, stockQty: ingredients.stockQty, lowStockThreshold: ingredients.lowStockThreshold })
      .from(ingredients).where(eq(ingredients.venueId, venue.id)),

    // 4. 30-day chart sales
    db.select({ soldAt: sales.soldAt, total: sales.total })
      .from(sales).where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, thirtyDaysAgo))),

    // 5. 30-day chart expenses
    db.select({ expensedAt: expenses.expensedAt, amount: expenses.amount })
      .from(expenses).where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, thirtyDaysAgoStr))),

    // 6. Today's top dishes by gross profit (unitPrice − unitCost × qty)
    db.select({
      dishId:       saleItems.dishId,
      dishName:     dishes.name,
      totalQty:     sql<string>`sum(${saleItems.qty})::text`,
      totalRevenue: sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})::text`,
      totalCogs:    sql<string>`sum(${saleItems.qty} * ${saleItems.unitCost})::text`,
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart)))
      .groupBy(saleItems.dishId, dishes.name)
      .orderBy(desc(sql`sum((${saleItems.unitPrice} - ${saleItems.unitCost}) * ${saleItems.qty})`))
      .limit(5),

    // 7. Getting-started: dish existence check (ingredients already in allIngredients)
    db.select({ id: dishes.id }).from(dishes).where(eq(dishes.venueId, venue.id)).limit(1),

    // 8. Today's revenue by channel
    db.select({
      channel:  sales.channel,
      revenue:  sql<string>`sum(${sales.total})::text`,
      count:    sql<string>`count(*)::text`,
    })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, todayStart), lt(sales.soldAt, tomorrowStart)))
      .groupBy(sales.channel)
      .orderBy(desc(sql`sum(${sales.total})`)),

    // 9. This week vs last week sales
    db.select({
      thisWeekRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${weekStartIso} then ${sales.total}::bigint else 0 end), 0)`,
      thisWeekCount:   sql<string>`coalesce(count(case when ${sales.soldAt} >= ${weekStartIso} then 1 end), 0)`,
      lastWeekRevenue: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${lastWeekStartIso} and ${sales.soldAt} < ${weekStartIso} then ${sales.total}::bigint else 0 end), 0)`,
      lastWeekCount:   sql<string>`coalesce(count(case when ${sales.soldAt} >= ${lastWeekStartIso} and ${sales.soldAt} < ${weekStartIso} then 1 end), 0)`,
    }).from(sales).where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, lastWeekStart))),

    // 10. Recipe-based COGS — the industry-standard food cost denominator.
    //     We sum unit_cost × qty over sale_items joined to today's + month's sales.
    //     This is "Cost of Goods Sold from what we actually sold", which is
    //     independent of when ingredients were purchased.
    db.select({
      cogsToday: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${todayStartIso} and ${sales.soldAt} < ${tomorrowStartIso} then ${saleItems.qty} * ${saleItems.unitCost} else 0 end), 0)`,
      cogsMonth: sql<string>`coalesce(sum(case when ${sales.soldAt} >= ${monthStartIso} then ${saleItems.qty} * ${saleItems.unitCost} else 0 end), 0)`,
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, lastMonthStart))),
  ])

  // Waste queries isolated — degrade gracefully if waste_logs table not yet migrated
  let todayWasteRows: { total: string }[] = [{ total: '0' }]
  let wasteByDayRows: { wastedAt: string; total: string }[] = []
  try {
    ;[todayWasteRows, wasteByDayRows] = await Promise.all([
      db.select({ total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)` })
        .from(wasteLogs).where(and(eq(wasteLogs.venueId, venue.id), eq(wasteLogs.wastedAt, todayDateStr))),
      db.select({
        wastedAt: wasteLogs.wastedAt,
        total:    sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)`,
      })
        .from(wasteLogs)
        .where(and(eq(wasteLogs.venueId, venue.id), gte(wasteLogs.wastedAt, sevenDaysAgoStr)))
        .groupBy(wasteLogs.wastedAt)
        .orderBy(wasteLogs.wastedAt),
    ])
  } catch {
    // waste_logs not yet migrated — show zeros
  }

  // ── KPI calculations ───────────────────────────────────────────────────────
  const revenueToday          = Number(salesAgg[0].todayRevenue)
  const revenueYesterday      = Number(salesAgg[0].yesterdayRevenue)
  const revenueMonth          = Number(salesAgg[0].monthRevenue)
  const revenueLastMonth      = Number(salesAgg[0].lastMonthRevenue)
  const ingredientCostMonth   = Number(expensesAgg[0].ingredientCostMonth)
  const totalExpensesMonth    = Number(expensesAgg[0].totalExpensesMonth)

  const expenseCategories = [
    { label: 'Ingredients', amount: ingredientCostMonth },
    { label: 'Labor',       amount: Number(expensesAgg[0].catLabor) },
    { label: 'Rent',        amount: Number(expensesAgg[0].catRent) },
    { label: 'Utilities',   amount: Number(expensesAgg[0].catUtilities) },
    { label: 'Marketing',   amount: Number(expensesAgg[0].catMarketing) },
    { label: 'Other',       amount: Number(expensesAgg[0].catOther) },
  ].filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

  const lastMonthExpenses = Number(expensesAgg[0].lastMonthExpenses)
  const netProfit         = revenueMonth - totalExpensesMonth
  const lastMonthNet      = revenueLastMonth - lastMonthExpenses
  const netDelta          = delta(netProfit, lastMonthNet)
  const expensesDelta     = delta(totalExpensesMonth, lastMonthExpenses)
  const monthLabel        = monthStart.toLocaleDateString('en-US', { month: 'long' })

  const todayDelta = delta(revenueToday, revenueYesterday)
  const monthDelta = delta(revenueMonth, revenueLastMonth)

  const todayTransactionCount = Number(salesAgg[0].todayCount)
  const todayExpenses         = Number(expensesAgg[0].todayExpenses)
  const todayWaste            = Number(todayWasteRows[0].total)

  const wasteMap = new Map(wasteByDayRows.map(r => [r.wastedAt, Number(r.total)]))
  const wasteTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo); d.setDate(d.getDate() + i)
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: tz })
    return { date: dateStr, amount: wasteMap.get(dateStr) ?? 0 }
  })
  const yesterdayWaste  = wasteMap.get(yesterdayDateStr) ?? 0
  const wasteDelta      = delta(todayWaste, yesterdayWaste)
  const maxWaste        = Math.max(...wasteTrend.map(w => w.amount), 1)

  const thisWeekRevenue = Number(weekAgg[0].thisWeekRevenue)
  const lastWeekRevenue = Number(weekAgg[0].lastWeekRevenue)
  const thisWeekCount   = Number(weekAgg[0].thisWeekCount)
  const lastWeekCount   = Number(weekAgg[0].lastWeekCount)
  const thisWeekAOV     = thisWeekCount > 0 ? thisWeekRevenue / thisWeekCount : 0
  const lastWeekAOV     = lastWeekCount > 0 ? lastWeekRevenue / lastWeekCount : 0
  const weekRevDelta    = delta(thisWeekRevenue, lastWeekRevenue)
  const weekCountDelta  = delta(thisWeekCount, lastWeekCount)
  const weekAOVDelta    = delta(thisWeekAOV, lastWeekAOV)

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

  // Food cost % uses recipe COGS (sale_items.unit_cost × qty) — the industry-standard
  // measure. Ingredient *purchases* this month show under the expense breakdown below.
  const cogsMonth      = Number(cogsAgg[0].cogsMonth)
  const cogsToday      = Number(cogsAgg[0].cogsToday)
  const foodCostPct    = revenueMonth > 0 ? (cogsMonth / revenueMonth) * 100 : null
  const grossMarginPct = revenueMonth > 0 ? ((revenueMonth - cogsMonth) / revenueMonth) * 100 : null
  const foodCostTodayPct = revenueToday > 0 ? (cogsToday / revenueToday) * 100 : null

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
    const date = d.toLocaleDateString('en-CA', { timeZone: tz })
    return { date, revenue: Math.round((revMap.get(date) ?? 0) / 100), expenses: Math.round((expMap.get(date) ?? 0) / 100) }
  })

  // ── KPI card definitions ───────────────────────────────────────────────────
  // Staff role sees Revenue Today + Month Revenue only — food cost % and gross
  // margin reveal what the business actually earns and stay owner-only.
  const kpis = [
    {
      label: 'Revenue Today',
      value: formatCurrency(revenueToday),
      raw: revenueToday as number | null,
      fmt: 'currency' as const,
      sub: revenueMonth > 0 ? `${formatCurrency(revenueMonth)} this month` : 'no sales yet this month',
      delta: todayDelta,
      deltaLabel: 'vs yesterday',
      status: 'neutral' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1.5 10L5 6.5l2.5 2.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 3h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Month Revenue',
      value: formatCurrency(revenueMonth),
      raw: revenueMonth as number | null,
      fmt: 'currency' as const,
      sub: revenueLastMonth > 0 ? `${formatCurrency(revenueLastMonth)} last month` : 'first month tracked',
      delta: monthDelta,
      deltaLabel: 'vs last month',
      status: 'neutral' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="3" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M1.5 6.5h11M5 1.5v3M9 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    ...(showFin ? [
      {
        label: 'Food Cost %',
        value: foodCostPct !== null ? `${foodCostPct.toFixed(1)}%` : '—',
        raw: foodCostPct as number | null,
        fmt: 'percent' as const,
        sub: foodCostTodayPct !== null
          ? `${foodCostTodayPct.toFixed(1)}% today · recipe COGS MTD`
          : 'recipe COGS vs revenue MTD',
        delta: null,
        deltaLabel: '',
        status: foodCostPct !== null && foodCostPct > (venue.foodCostTarget ?? 35) ? 'warn' as const : 'good' as const,
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4.5 9.5l5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="5" cy="4.75" r="1" fill="currentColor"/>
            <circle cx="9" cy="9.25" r="1" fill="currentColor"/>
          </svg>
        ),
      },
      {
        label: 'Gross Margin',
        value: grossMarginPct !== null ? `${grossMarginPct.toFixed(1)}%` : '—',
        raw: grossMarginPct as number | null,
        fmt: 'percent' as const,
        sub: 'after recipe COGS MTD',
        delta: null,
        deltaLabel: '',
        status: grossMarginPct !== null && grossMarginPct < 30 ? 'warn' as const : 'neutral' as const,
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 11.5V8.5M5.5 11.5V5.5M9 11.5V7.5M12.5 11.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ] : []),
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
      done: anyDish.length > 0,
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

  const CHANNEL_LABELS: Record<string, string> = {
    dine_in:  'Dine-in',
    takeout:  'Takeout',
    delivery: 'Delivery',
    other:    'Other',
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
  })

  const foodCostThreshold = venue.foodCostTarget ?? 35

  const laborCost = Number(expensesAgg[0].catLabor)
  const laborPct  = revenueMonth > 0 ? (laborCost / revenueMonth) * 100 : null

  // Today's opening/closing checklist progress — single indexed read pair.
  const checklistSummary = await getTodayChecklistSummary()

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-7">

      {/* Header */}
      <div className="card-enter card-d0 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-ink tracking-tight">{greet(tz)}</h1>
              <span className="live-dot shrink-0" title="Live" />
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

        {/* Daily revenue goal — inline progress bar */}
        {dailyTargetPct !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-ink-4 uppercase tracking-widest">
                Today&apos;s Target
              </span>
              <span className={`text-[11px] tabular font-semibold ${dailyTargetMet ? 'text-success' : 'text-ink-3'}`}>
                {formatCurrency(revenueToday)}
                <span className="font-normal text-ink-4"> / {formatCurrency(dailyTarget)}</span>
                {dailyTargetMet
                  ? <span className="ml-1.5 text-success">✓ Goal hit!</span>
                  : <span className="ml-1.5 text-ink-4">{dailyTargetPct.toFixed(0)}%</span>
                }
              </span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${dailyTargetMet ? 'bg-success' : 'bg-gradient-to-r from-accent to-accent-2'}`}
                style={{ width: `${dailyTargetPct}%` }}
              />
            </div>
          </div>
        )}
        {dailyTargetPct === null && (
          <p className="text-[11px] text-ink-4">
            Set a daily target in{' '}
            <Link href="/settings" className="text-accent hover:underline underline-offset-2">Settings</Link>
            {' '}to track today&apos;s progress here.
          </p>
        )}
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

      {/* AI today's push — Premium-only + owner-only (reveals margins),
          hidden when no Anthropic key is configured. */}
      {premium && showFin && process.env.ANTHROPIC_API_KEY && (
        <AiTodayPush
          initialText={await getOrGenerateTodayPush(account.id, venue.id)}
          refresh={refreshTodayPush}
        />
      )}

      {/* Today's checklists — opening + closing progress at a glance */}
      <Link
        href="/checklists"
        className="card-enter card-d2 glass rounded-xl border border-hair flex flex-wrap items-center gap-3 px-4 py-3 hover:border-accent/40 transition-colors"
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-6 h-6 rounded-lg bg-accent-dim flex items-center justify-center text-accent" aria-hidden>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2.5" y="1.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 1.5h4v1.5H5z" fill="currentColor"/>
              <path d="M4.75 6.5l1 1 1.75-2M9.25 6.25H8M4.75 9.5l1 1 1.75-2M9.25 9.25H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="text-[12px] font-semibold text-ink uppercase tracking-widest">Daily Routine</span>
        </div>
        {(['opening', 'closing'] as const).map(kind => {
          const s = checklistSummary[kind]
          const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
          const tone =
            s.state === 'done' ? 'text-success bg-success/10 border-success/30' :
            s.state === 'in-progress' ? 'text-accent bg-accent/10 border-accent/30' :
            'text-ink-4 bg-surface-2 border-hair'
          return (
            <div key={kind} className={`flex-1 min-w-[160px] flex items-center gap-2.5 px-3 py-1.5 rounded-lg border ${tone}`}>
              <span className="shrink-0" aria-hidden>
                {kind === 'opening' ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5v2M2.5 8h-1M14.5 8h-1M3.8 3.8l-.7-.7M12.9 3.1l-.7.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M4.5 8a3.5 3.5 0 017 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M1.5 11.5h13M3.5 14h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide leading-tight">
                  {kind === 'opening' ? 'Opening' : 'Closing'}
                </p>
                <p className="text-[10px] opacity-80 leading-tight">
                  {s.state === 'not-started' && 'not started'}
                  {s.state === 'in-progress' && `${s.done}/${s.total} steps`}
                  {s.state === 'done' && 'done ✓'}
                </p>
              </div>
              {s.total > 0 && (
                <span className="text-[10px] tabular font-bold">{pct}%</span>
              )}
            </div>
          )
        })}
        <span className="text-[11px] text-ink-4 shrink-0 hover:text-ink">Open →</span>
      </Link>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={kpi.label} className={`card-enter card-d${idx + 1} glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden`}>
            {/* Status edge only where it carries real meaning (over-target /
                healthy) — softened. Neutral cards stay clean: no decoration. */}
            {kpi.status !== 'neutral' && (
              <div className={`absolute inset-x-0 top-0 h-px ${
                kpi.status === 'warn' ? 'bg-warn/60' : 'bg-success/60'
              }`} />
            )}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-ink-4 uppercase tracking-widest">{kpi.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                kpi.status === 'warn' ? 'bg-warn/15 text-warn' : kpi.status === 'good' ? 'bg-success/15 text-success' : 'bg-accent-dim text-accent'
              }`}>
                {kpi.icon}
              </div>
            </div>
            <p className={`text-[1.65rem] font-bold tabular tracking-tight leading-none ${
              kpi.status === 'warn' ? 'text-warn' : 'text-ink'
            }`}>
              {kpi.raw != null
                ? <Figure value={kpi.raw} format={kpi.fmt} decimals={1} />
                : kpi.value}
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

        {/* Stock alerts card — always visible so owners know stock health at a glance */}
        <Link
          href="/inventory"
          className="card-enter glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden hover:ring-1 hover:ring-accent/30 transition-all"
        >
          <div className={`absolute inset-x-0 top-0 h-[2px] ${
            outOfStock.length > 0 ? 'bg-danger' : lowStockCount > 0 ? 'bg-warn' : 'bg-success'
          }`} />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-4 uppercase tracking-widest">Stock Alerts</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              outOfStock.length > 0 ? 'bg-danger/15 text-danger' : lowStockCount > 0 ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'
            }`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1.5" y="4" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1.5 7h11M5 4V2.5h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className={`text-[1.65rem] font-bold tabular tracking-tight leading-none ${
            outOfStock.length > 0 ? 'text-danger' : lowStockCount > 0 ? 'text-warn' : 'text-success'
          }`}>
            {lowStockCount === 0 ? 'All clear' : lowStockCount}
          </p>
          <p className="text-[11px] text-ink-4 leading-snug">
            {lowStockCount === 0
              ? `${allIngredients.length} ingredient${allIngredients.length !== 1 ? 's' : ''} healthy`
              : `${outOfStock.length} out · ${lowStock.length} low`}
          </p>
        </Link>
      </div>

      {/* Monthly P&L summary */}
      <div className="card-enter card-d2 glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-hair flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 10V7.5M3.5 10V5M6 10V7M8.5 10V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Monthly P&amp;L — {monthLabel}</p>
          </div>
          <Link href="/expenses" className="text-[11px] text-accent hover:underline underline-offset-2">View Expenses →</Link>
        </div>
        <div className={`grid ${showFin ? 'grid-cols-4' : 'grid-cols-3'} divide-x divide-hair`}>
          {/* Revenue */}
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Revenue</p>
            <p className="text-xl font-bold tabular text-ink"><Figure value={revenueMonth} format="currency" /></p>
            {monthDelta && (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${monthDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {monthDelta.up ? '↑' : '↓'}{Math.abs(monthDelta.pct).toFixed(0)}% vs last mo
              </span>
            )}
          </div>
          {/* Expenses */}
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Expenses</p>
            <p className="text-xl font-bold tabular text-ink"><Figure value={totalExpensesMonth} format="currency" /></p>
            {expensesDelta && (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${!expensesDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {expensesDelta.up ? '↑' : '↓'}{Math.abs(expensesDelta.pct).toFixed(0)}% vs last mo
              </span>
            )}
          </div>
          {/* Net Profit */}
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Net Profit</p>
            <p className={`text-xl font-bold tabular ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {netProfit < 0 ? '−' : ''}<Figure value={Math.abs(netProfit)} format="currency" />
            </p>
            {netDelta && (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${netDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {netDelta.up ? '↑' : '↓'}{Math.abs(netDelta.pct).toFixed(0)}% vs last mo
              </span>
            )}
          </div>
          {/* Labor % of revenue — owner-only; tells owners their biggest controllable cost */}
          {showFin && (
            <div className="px-4 py-4 space-y-1.5">
              <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Labor %</p>
              <p className={`text-xl font-bold tabular ${laborPct !== null && laborPct > 35 ? 'text-warn' : 'text-ink'}`}>
                {laborPct !== null ? <Figure value={laborPct} format="percent" /> : '—'}
              </p>
              <span className="text-[10px] text-ink-4">
                {laborCost > 0 ? `${formatCurrency(laborCost)} MTD` : 'no labor logged'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Week over Week */}
      <div className="card-enter card-d3 glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-hair">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 5.5h9M7 3l2.5 2.5L7 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">This Week vs Last Week</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-hair">
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Revenue</p>
            <p className="text-xl font-bold tabular text-ink"><Figure value={thisWeekRevenue} format="currency" /></p>
            {weekRevDelta ? (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${weekRevDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {weekRevDelta.up ? '↑' : '↓'}{Math.abs(weekRevDelta.pct).toFixed(0)}% vs last wk
              </span>
            ) : <span className="text-[10px] text-ink-4">first week</span>}
          </div>
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Transactions</p>
            <p className="text-xl font-bold tabular text-ink"><Figure value={thisWeekCount} format="number" /></p>
            {weekCountDelta ? (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${weekCountDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {weekCountDelta.up ? '↑' : '↓'}{Math.abs(weekCountDelta.pct).toFixed(0)}% vs last wk
              </span>
            ) : <span className="text-[10px] text-ink-4">first week</span>}
          </div>
          <div className="px-4 py-4 space-y-1.5">
            <p className="text-[10px] font-medium text-ink-4 uppercase tracking-widest">Avg Order</p>
            <p className="text-xl font-bold tabular text-ink">{thisWeekCount > 0 ? <Figure value={Math.round(thisWeekAOV)} format="currency" /> : '—'}</p>
            {weekAOVDelta ? (
              <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${weekAOVDelta.up ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {weekAOVDelta.up ? '↑' : '↓'}{Math.abs(weekAOVDelta.pct).toFixed(0)}% vs last wk
              </span>
            ) : <span className="text-[10px] text-ink-4">first week</span>}
          </div>
        </div>
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

      {/* Chart + right column (Top Sellers + Channel Breakdown) */}
      <div className="card-enter card-d5 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Cashflow chart */}
        <div className="lg:col-span-2 glass card-glow rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1 8.5L3.5 5.5 5.5 7.5 8.5 3.5 10 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">30-Day Cashflow</p>
                  <p className="text-xs text-ink-4 mt-0.5">Revenue vs Expenses</p>
                </div>
              </div>
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

        {/* Right column — Top Sellers + Channel Breakdown stacked */}
        <div className="flex flex-col gap-4">

          {/* Top sellers by gross profit */}
          <div className="glass card-glow rounded-xl p-4 space-y-3 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1l1.1 3.4H10L7.2 6.5l1.1 3.4L5.5 8 2.7 9.9l1.1-3.4L1 4.4h3.4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Today&apos;s Top by Profit</p>
              </div>
              <span className="text-[9px] text-ink-4 uppercase tracking-wider font-medium">gross ₱</span>
            </div>
            {topDishesRows.length > 0 ? (
              <div className="space-y-2.5">
                {topDishesRows.map((dish, i) => {
                  const rev  = Number(dish.totalRevenue)
                  const cogs = Number(dish.totalCogs)
                  const gp   = rev - cogs
                  const gpPct = rev > 0 ? Math.round((gp / rev) * 100) : null
                  return (
                    <div key={dish.dishId ?? i} className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold w-4 tabular shrink-0 ${i === 0 ? 'text-accent' : 'text-ink-4'}`}>{i + 1}</span>
                      <span className="flex-1 text-[13px] text-ink truncate">{dish.dishName}</span>
                      <span className="text-[11px] tabular text-ink-4 shrink-0">{Number(dish.totalQty)}×</span>
                      <div className="text-right shrink-0">
                        <span className="text-[13px] tabular font-semibold text-accent block">{formatCurrency(gp)}</span>
                        {gpPct !== null && cogs > 0 && (
                          <span className={`text-[9px] tabular ${gpPct < 30 ? 'text-warn' : 'text-ink-4'}`}>{gpPct}%</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-sm text-ink-4">
                No sales today yet
              </div>
            )}
          </div>

          {/* Channel breakdown */}
          <div className="glass card-glow rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 9h9M1 6.5h6M1 4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Today by Channel</p>
            </div>
            {channelRows.length > 0 ? (
              <div className="space-y-3">
                {channelRows.map((row) => {
                  const rev = Number(row.revenue)
                  const pct = revenueToday > 0 ? Math.min((rev / revenueToday) * 100, 100) : 0
                  const label = CHANNEL_LABELS[row.channel] ?? row.channel
                  const cnt = Number(row.count)
                  return (
                    <div key={row.channel} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-ink font-medium">{label}</span>
                        <span className="text-[12px] tabular font-semibold text-accent shrink-0">
                          {formatCurrency(rev)}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-700"
                          style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
                        />
                      </div>
                      <p className="text-[10px] text-ink-4">
                        {pct.toFixed(0)}% · {cnt} sale{cnt !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-sm text-ink-4">
                No sales today yet
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Waste tracker */}
      <div className="card-enter card-d6 glass card-glow rounded-xl px-5 py-4 flex items-center justify-between gap-6">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-warn/12 flex items-center justify-center shrink-0 text-warn">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 3h8M4 3V2h3v1M3.5 3l.5 6.5h3.5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Today&apos;s Waste</p>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className={`text-2xl font-bold tabular ${todayWaste > 0 ? 'text-warn' : 'text-ink-4'}`}>
              <Figure value={todayWaste} format="currency" />
            </p>
            {wasteDelta && (
              <span className={`text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${wasteDelta.up ? 'text-danger bg-danger/12' : 'text-success bg-success/12'}`}>
                {wasteDelta.up ? '↑' : '↓'}{Math.abs(wasteDelta.pct).toFixed(0)}% vs yesterday
              </span>
            )}
          </div>
          <Link href="/waste" className="text-[11px] text-ink-4 hover:text-accent transition-colors">
            Log &amp; track waste →
          </Link>
        </div>
        {/* 7-day sparkline bars */}
        <div className="flex items-end gap-[3px] shrink-0" style={{ height: '44px' }}>
          {wasteTrend.map((day, i) => {
            const isToday   = i === 6
            const barHeight = maxWaste > 0 ? Math.max((day.amount / maxWaste) * 44, 3) : 3
            return (
              <div
                key={day.date}
                title={`${day.date}: ${formatCurrency(day.amount)}`}
                className={`w-4 rounded-sm transition-all duration-300 ${isToday ? 'bg-warn' : 'bg-warn/25'}`}
                style={{ height: `${barHeight}px` }}
              />
            )
          })}
        </div>
      </div>

      {/* Expense breakdown by category */}
      {expenseCategories.length > 0 && (
        <div className="card-enter card-d7 glass card-glow rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 1.5h4.5l4 4-4.5 4.5-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <circle cx="4" cy="4" r="1" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Expenses by Category — {monthLabel}</p>
            </div>
            <Link href="/expenses" className="text-[11px] text-accent hover:underline underline-offset-2">All expenses →</Link>
          </div>
          <div className="space-y-3">
            {expenseCategories.map((cat) => {
              const pct = totalExpensesMonth > 0 ? (cat.amount / totalExpensesMonth) * 100 : 0
              return (
                <div key={cat.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-ink">{cat.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-ink-4 tabular">{pct.toFixed(0)}%</span>
                      <span className="text-[12px] tabular font-semibold text-ink">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-hair">
            <span className="text-[11px] text-ink-4">Total this month</span>
            <span className="text-sm font-bold tabular text-ink">{formatCurrency(totalExpensesMonth)}</span>
          </div>
        </div>
      )}

    </div>
  )
}

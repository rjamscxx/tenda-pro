import { db } from '@/lib/db'
import { sales, expenses } from '@/lib/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro as checkPro } from '@/lib/plan'
import { canSeeFinancials } from '@/lib/permissions'
import PremiumLockPage from '@/components/ui/PremiumLockPage'
import AnalyticsClient from './AnalyticsClient'
import { redirect } from 'next/navigation'

export const revalidate = 60
export const metadata = { title: 'Analytics — Sizzle' }

const CAT_LABELS: Record<string, string> = {
  ingredients: 'Ingredients', labor: 'Labor', rent: 'Rent',
  utilities: 'Utilities', marketing: 'Marketing', other: 'Other',
}

function toLocalDate(d: Date | string, tz: string) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: tz })
}

// Day-of-week (0=Sun…6=Sat) for a calendar date string, independent of server tz.
// Treats the YYYY-MM-DD string as a calendar date and reads its UTC weekday.
function calendarDow(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay()
}

export default async function AnalyticsPage() {
  const { venue, account, dbUser } = await requireVenue()
  if (!canSeeFinancials(dbUser)) redirect('/dashboard')

  if (!checkPro(account)) {
    return <PremiumLockPage />
  }

  const tz = venue.timezone || 'Asia/Manila'
  const now = new Date()

  // Window boundaries
  const d90 = new Date(now); d90.setDate(d90.getDate() - 89)
  const d6m = new Date(now); d6m.setDate(1); d6m.setMonth(d6m.getMonth() - 5)
  const sixMonthStart = toLocalDate(d6m, tz).slice(0, 7) + '-01'

  const [rawSales, rawExpenses] = await Promise.all([
    // Fetch 6 months of sales so Monthly P&L revenue is complete, not just the 90-day chart window
    db.select({ soldAt: sales.soldAt, total: sales.total })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, d6m))),
    db.select({ expensedAt: expenses.expensedAt, amount: expenses.amount, category: expenses.category })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, sixMonthStart))),
  ])

  // ── Daily revenue (90 days, filled with zeroes) ──────────────────────────
  const dailyMap = new Map<string, number>()
  for (const s of rawSales) {
    const date = toLocalDate(s.soldAt, tz)
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + s.total)
  }
  const dailyRevenue: { date: string; revenue: number }[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const date = toLocalDate(d, tz)
    dailyRevenue.push({ date, revenue: (dailyMap.get(date) ?? 0) / 100 })
  }

  // ── Revenue by day-of-week (0=Sun…6=Sat), returns average ───────────────
  const dowRevenue = [0, 0, 0, 0, 0, 0, 0]
  const dowCount   = [0, 0, 0, 0, 0, 0, 0]
  for (const { date, revenue } of dailyRevenue) {
    const dow = calendarDow(date)
    dowRevenue[dow] += revenue
    dowCount[dow]++
  }
  const revenueByDow = dowRevenue.map((total, i) =>
    dowCount[i] > 0 ? Math.round(total / dowCount[i]) : 0
  )

  // ── Expense category breakdown (last 90 days) ────────────────────────────
  const d90Str = toLocalDate(d90, tz)
  const catMap = new Map<string, number>()
  for (const e of rawExpenses) {
    const date = toLocalDate(e.expensedAt, tz)
    if (date >= d90Str) {
      catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount)
    }
  }
  const expensesByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({ category: CAT_LABELS[category] ?? category, amount: Math.round(amount / 100) }))
    .sort((a, b) => b.amount - a.amount)

  // ── Monthly P&L (6 months) ───────────────────────────────────────────────
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth() - i)
    months.push(toLocalDate(d, tz).slice(0, 7))
  }
  const mRevMap = new Map<string, number>()
  const mExpMap = new Map<string, number>()
  for (const s of rawSales) {
    const m = toLocalDate(s.soldAt, tz).slice(0, 7)
    mRevMap.set(m, (mRevMap.get(m) ?? 0) + s.total)
  }
  for (const e of rawExpenses) {
    const m = toLocalDate(e.expensedAt, tz).slice(0, 7)
    mExpMap.set(m, (mExpMap.get(m) ?? 0) + e.amount)
  }
  const monthlyPnL = months.map(m => {
    const revenue  = Math.round((mRevMap.get(m) ?? 0) / 100)
    const expTotal = Math.round((mExpMap.get(m) ?? 0) / 100)
    return { month: m, revenue, expenses: expTotal, profit: revenue - expTotal }
  })

  // ── 7-day forecast using day-of-week averages ────────────────────────────
  const forecastDays: { date: string; mid: number; low: number; high: number }[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i)
    const date = toLocalDate(d, tz)
    const dow  = calendarDow(date)
    const mid  = revenueByDow[dow]
    forecastDays.push({ date, mid, low: Math.round(mid * 0.82), high: Math.round(mid * 1.18) })
  }

  return (
    <div className="flex flex-col h-full">
      <AnalyticsClient
        dailyRevenue={dailyRevenue}
        revenueByDow={revenueByDow}
        expensesByCategory={expensesByCategory}
        monthlyPnL={monthlyPnL}
        forecastDays={forecastDays}
      />
    </div>
  )
}

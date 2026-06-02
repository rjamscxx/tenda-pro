import { db } from '@/lib/db'
import { sales, expenses, saleItems, dishes, wasteLogs } from '@/lib/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { canSeeFinancials } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReportsClient, { type MonthData } from './ReportsClient'

export const revalidate = 30
export const metadata = { title: 'Reports — Sizzle' }

const CATEGORY_LABELS: Record<string, string> = {
  ingredients: 'Ingredients', labor: 'Labor', rent: 'Rent',
  utilities: 'Utilities', marketing: 'Marketing', other: 'Other',
}
const CHANNEL_LABELS: Record<string, string> = {
  dine_in: 'Dine-in', takeout: 'Takeout', delivery: 'Delivery', other: 'Other',
}

function manilaMonth(date: Date | string) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).slice(0, 7)
}
function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-PH', { month: 'long', year: 'numeric' })
}

export default async function ReportsPage() {
  const { venue, dbUser } = await requireVenue()
  if (!canSeeFinancials(dbUser)) redirect('/dashboard')

  const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const currentMonth = nowManila.toLocaleDateString('en-CA').slice(0, 7)

  // Build 6-month window oldest → newest using safe month arithmetic.
  // (Avoids setMonth's day-overflow: e.g. May 30 → setMonth(1) lands in
  //  March because Feb has only 28 days, which used to produce "2026-03"
  //  twice — once as the Feb slot, once as the real March slot.)
  const baseTotalMonths = nowManila.getFullYear() * 12 + nowManila.getMonth()
  const months = Array.from({ length: 6 }, (_, i) => {
    const t     = baseTotalMonths - (5 - i)
    const year  = Math.floor(t / 12)
    const month = ((t % 12) + 12) % 12 // safe for negatives
    return `${year}-${String(month + 1).padStart(2, '0')}`
  })

  const sixMonthsAgo = new Date(`${months[0]}-01T00:00:00+08:00`)

  const [allSales, allExpenses, allSaleItems, allWaste] = await Promise.all([
    db.select({ soldAt: sales.soldAt, total: sales.total, channel: sales.channel })
      .from(sales)
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, sixMonthsAgo))),
    db.select({ expensedAt: expenses.expensedAt, amount: expenses.amount, category: expenses.category })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), gte(expenses.expensedAt, months[0] + '-01'))),
    db.select({
      soldAt:       sales.soldAt,
      dishName:     dishes.name,
      qty:          saleItems.qty,
      unitPrice:    saleItems.unitPrice,
    })
      .from(saleItems)
      .innerJoin(sales,  eq(saleItems.saleId, sales.id))
      .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, sixMonthsAgo))),
    db.select({ wastedAt: wasteLogs.wastedAt, estimatedCost: wasteLogs.estimatedCost })
      .from(wasteLogs)
      .where(and(eq(wasteLogs.venueId, venue.id), gte(wasteLogs.wastedAt, months[0] + '-01'))),
  ])

  // Pre-compute per-month aggregates on server
  const monthlyData: MonthData[] = months.map(month => {
    const mSales = allSales.filter(s => manilaMonth(s.soldAt) === month)
    const mExpenses = allExpenses.filter(e => e.expensedAt.startsWith(month))
    const mWaste = allWaste.filter(w => w.wastedAt.startsWith(month))

    const revenue = mSales.reduce((s, r) => s + Number(r.total), 0)
    const totalExp = mExpenses.reduce((s, r) => s + Number(r.amount), 0)
    const wasteTotal = mWaste.reduce((s, w) => s + Number(w.estimatedCost), 0)
    const profit = revenue - totalExp
    const margin = revenue > 0 ? (profit / revenue) * 100 : null

    const channelMap = new Map<string, number>()
    for (const s of mSales) channelMap.set(s.channel, (channelMap.get(s.channel) ?? 0) + Number(s.total))
    const byChannel = [...channelMap.entries()]
      .map(([channel, amount]) => ({
        channel, label: CHANNEL_LABELS[channel] ?? channel, amount,
        pct: revenue > 0 ? (amount / revenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const categoryMap = new Map<string, number>()
    for (const e of mExpenses) categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + Number(e.amount))
    const byCategory = [...categoryMap.entries()]
      .map(([category, amount]) => ({
        category, label: CATEGORY_LABELS[category] ?? category, amount,
        pct: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const dishMap = new Map<string, { totalQty: number; totalRevenue: number }>()
    for (const si of allSaleItems) {
      if (manilaMonth(si.soldAt) !== month) continue
      const cur = dishMap.get(si.dishName) ?? { totalQty: 0, totalRevenue: 0 }
      dishMap.set(si.dishName, {
        totalQty:     cur.totalQty     + Number(si.qty),
        totalRevenue: cur.totalRevenue + Number(si.qty) * Number(si.unitPrice),
      })
    }
    const topDishes = [...dishMap.entries()]
      .map(([dishName, v]) => ({ dishName, ...v }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    return {
      month, label: monthLabel(month), revenue, expenses: totalExp, wasteTotal, profit, margin,
      transactionCount: mSales.length, expenseCount: mExpenses.length, wasteCount: mWaste.length,
      byChannel, byCategory, topDishes,
    }
  })

  const hasAnyData = monthlyData.some(m => m.revenue > 0 || m.expenses > 0)

  if (!hasAnyData) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-hair flex items-center justify-center mx-auto">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="text-ink-3">
              <path d="M4 22l6-8 5 5 6-9 5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="3" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2"/>
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-ink tracking-tight">No data to report yet</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              Reports unlock once you start logging sales and expenses. It only takes a minute.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/pos" className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold">
              Log a sale →
            </Link>
            <Link href="/expenses" className="px-5 py-2.5 rounded-xl border border-hair text-sm text-ink-2 hover:border-accent hover:text-ink transition-colors">
              Log an expense
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <ReportsClient months={monthlyData} currentMonth={currentMonth} />
}

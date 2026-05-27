import { db } from '@/lib/db'
import { sales, expenses, saleItems, dishes, wasteLogs, dailyDigests } from '@/lib/db/schema'
import { and, desc, eq, gte } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import ReportsClient, { type MonthData, type DigestEntry } from './ReportsClient'

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
  const { venue } = await requireVenue()

  const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const currentMonth = nowManila.toLocaleDateString('en-CA').slice(0, 7)

  // Build 6-month window oldest → newest
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(nowManila)
    d.setMonth(d.getMonth() - (5 - i))
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).slice(0, 7)
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
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5)

    return {
      month, label: monthLabel(month), revenue, expenses: totalExp, wasteTotal, profit, margin,
      transactionCount: mSales.length, expenseCount: mExpenses.length, wasteCount: mWaste.length,
      byChannel, byCategory, topDishes,
    }
  })

  // Fetch last 60 daily digests
  const digestRows = await db
    .select({
      date:         dailyDigests.date,
      digestJson:   dailyDigests.digestJson,
      insightsJson: dailyDigests.insightsJson,
      generatedAt:  dailyDigests.generatedAt,
    })
    .from(dailyDigests)
    .where(eq(dailyDigests.venueId, venue.id))
    .orderBy(desc(dailyDigests.date))
    .limit(60)

  type RawDigest = { revenue: number; expenses: number; profit: number; margin: number | null; saleCount: number; dayLabel: string }
  type RawInsight = { title: string; body: string; type?: string }[]

  const digests: DigestEntry[] = digestRows.map(r => ({
    date:       r.date,
    digestJson: r.digestJson as RawDigest,
    insights:   (r.insightsJson ?? []) as RawInsight,
    generatedAt: r.generatedAt?.toISOString() ?? null,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <ReportsClient months={monthlyData} currentMonth={currentMonth} digests={digests} />
    </div>
  )
}

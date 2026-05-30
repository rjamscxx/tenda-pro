import { cache } from 'react'
import { db } from '@/lib/db'
import { sales, saleItems, expenses, wasteLogs } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'

/**
 * Today's snapshot used by the topbar ticker + the close-day screen.
 * Cached per request so multiple components on the same page share one
 * round-trip. All amounts in cents; net = revenue − COGS − expenses − waste.
 */
export const getTodayKpi = cache(async (venueId: string) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const todayStart = new Date(`${today}T00:00:00+08:00`)
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000)

  const todayStartIso = todayStart.toISOString()
  const tomorrowStartIso = tomorrowStart.toISOString()

  const [revAgg, cogsAgg, expAgg, wasteAgg] = await Promise.all([
    db.select({
      revenue: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      tickets: sql<string>`count(*)`,
      unpaid:  sql<string>`coalesce(sum(case when ${sales.isPaid} = false then ${sales.total}::bigint else 0 end), 0)`,
    })
      .from(sales)
      .where(and(
        eq(sales.venueId, venueId),
        sql`${sales.soldAt} >= ${todayStartIso}`,
        sql`${sales.soldAt} <  ${tomorrowStartIso}`,
      )),
    db.select({
      cogs: sql<string>`coalesce(sum(${saleItems.qty} * ${saleItems.unitCost}::bigint), 0)`,
    })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(
        eq(sales.venueId, venueId),
        sql`${sales.soldAt} >= ${todayStartIso}`,
        sql`${sales.soldAt} <  ${tomorrowStartIso}`,
      )),
    db.select({
      total: sql<string>`coalesce(sum(${expenses.amount}::bigint), 0)`,
    })
      .from(expenses)
      .where(and(eq(expenses.venueId, venueId), eq(expenses.expensedAt, today))),
    db.select({
      total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}::bigint), 0)`,
    })
      .from(wasteLogs)
      .where(and(eq(wasteLogs.venueId, venueId), eq(wasteLogs.wastedAt, today)))
      .catch(() => [{ total: '0' }]),
  ])

  const revenue   = Number(revAgg[0].revenue)
  const tickets   = Number(revAgg[0].tickets)
  const unpaid    = Number(revAgg[0].unpaid)
  const cogs      = Number(cogsAgg[0].cogs)
  const expenses_ = Number(expAgg[0].total)
  const waste     = Number(wasteAgg[0].total)
  const net       = revenue - cogs - expenses_ - waste

  return { revenue, tickets, unpaid, cogs, expenses: expenses_, waste, net, today }
})

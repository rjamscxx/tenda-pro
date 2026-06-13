import { requireVenue } from '@/lib/queries/auth'
import { canSeeFinancials } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { getTodayKpi } from '@/lib/queries/todayKpi'
import { db } from '@/lib/db'
import { sales, saleItems, expenses, wasteLogs, dishes } from '@/lib/db/schema'
import { and, eq, sql, desc } from 'drizzle-orm'
import CloseDayClient from './CloseDayClient'

export const metadata = { title: 'Close Day — Tenda Pro' }

export default async function CloseDayPage() {
  const { venue, dbUser } = await requireVenue()
  if (!canSeeFinancials(dbUser)) redirect('/dashboard')
  const k = await getTodayKpi(venue.id)

  const today = k.today
  const todayStart = new Date(`${today}T00:00:00+08:00`)
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000)
  const todayStartIso = todayStart.toISOString()
  const tomorrowStartIso = tomorrowStart.toISOString()

  const [topSellers, todayExpenseRows, todayWasteRows, openTabs] = await Promise.all([
    db.select({
      dishName: dishes.name,
      qty:      sql<string>`sum(${saleItems.qty})::int`,
      revenue:  sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})::int`,
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

    db.select({
      id: expenses.id, category: expenses.category, amount: expenses.amount,
      vendor: expenses.vendor, note: expenses.note,
    })
      .from(expenses)
      .where(and(eq(expenses.venueId, venue.id), eq(expenses.expensedAt, today)))
      .orderBy(desc(expenses.amount)),

    db.select({
      id: wasteLogs.id, ingredientName: wasteLogs.ingredientName,
      qty: wasteLogs.qty, unit: wasteLogs.unit, reason: wasteLogs.reason,
      estimatedCost: wasteLogs.estimatedCost,
    })
      .from(wasteLogs)
      .where(and(eq(wasteLogs.venueId, venue.id), eq(wasteLogs.wastedAt, today)))
      .orderBy(desc(wasteLogs.estimatedCost))
      .catch(() => []),

    db.select({
      id: sales.id, soldAt: sales.soldAt, total: sales.total,
      customerName: sales.customerName, note: sales.note, channel: sales.channel,
    })
      .from(sales)
      .where(and(
        eq(sales.venueId, venue.id),
        eq(sales.isPaid, false),
        sql`${sales.soldAt} >= ${todayStartIso}`,
        sql`${sales.soldAt} <  ${tomorrowStartIso}`,
      ))
      .orderBy(sales.soldAt),
  ])

  return (
    <CloseDayClient
      venueName={venue.name}
      ownerEmail={null /* server resolves from current auth user */}
      ownerName={dbUser.fullName}
      today={today}
      kpi={k}
      topSellers={topSellers.map(t => ({ dishName: t.dishName, qty: Number(t.qty), revenue: Number(t.revenue) }))}
      expenses={todayExpenseRows}
      waste={todayWasteRows}
      openTabs={openTabs.map(t => ({
        id: t.id, soldAt: t.soldAt.toISOString(), total: t.total,
        customerName: t.customerName, note: t.note, channel: t.channel,
      }))}
    />
  )
}

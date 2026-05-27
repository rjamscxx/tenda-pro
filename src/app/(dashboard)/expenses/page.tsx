import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import ExpensesClient from './ExpensesClient'

export const revalidate = 30
export const metadata = { title: 'Expenses — Sizzle' }

export default async function ExpensesPage() {
  const { venue } = await requireVenue()

  const [rows, vendorRows] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(eq(expenses.venueId, venue.id))
      .orderBy(desc(expenses.expensedAt), desc(expenses.createdAt)),

    db
      .selectDistinct({ vendor: expenses.vendor })
      .from(expenses)
      .where(eq(expenses.venueId, venue.id))
      .orderBy(sql`${expenses.vendor} asc nulls last`),
  ])

  const data = rows.map(e => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    vendor: e.vendor,
    note: e.note,
    expensedAt: e.expensedAt,
    isRecurring: e.isRecurring,
    recurrenceDay: e.recurrenceDay,
  }))

  const vendors = vendorRows
    .map(r => r.vendor)
    .filter((v): v is string => v !== null && v.length > 0)

  return (
    <div className="flex flex-col h-full">
      <ExpensesClient expenses={data} vendors={vendors} />
    </div>
  )
}

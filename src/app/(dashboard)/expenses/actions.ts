'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { writeAudit } from '@/lib/audit'

interface ExpenseInput {
  category: 'ingredients' | 'labor' | 'rent' | 'utilities' | 'marketing' | 'other'
  amount: number // cents
  vendor: string
  note: string
  expensedAt: string // YYYY-MM-DD
  isRecurring: boolean
  recurrenceDay: number | null // 1-28
}

export async function createExpense(input: ExpenseInput) {
  const { dbUser, venue } = await requireVenue()

  if (!input.amount || input.amount <= 0) return { error: 'Enter a valid amount.' }
  if (input.isRecurring && input.recurrenceDay !== null) {
    if (input.recurrenceDay < 1 || input.recurrenceDay > 28) return { error: 'Recurrence day must be 1–28.' }
  }

  const [row] = await db.insert(expenses).values({
    venueId: venue.id,
    userId: dbUser.id,
    category: input.category,
    amount: input.amount,
    vendor: input.vendor.trim() || null,
    note: input.note.trim() || null,
    expensedAt: input.expensedAt,
    isRecurring: input.isRecurring,
    recurrenceDay: input.isRecurring ? input.recurrenceDay : null,
  }).returning({ id: expenses.id })

  await writeAudit({
    venueId: venue.id,
    userId: dbUser.id,
    action: 'expense.created',
    tableName: 'expenses',
    recordId: row.id,
    newData: { category: input.category, amount: input.amount, vendor: input.vendor, expensedAt: input.expensedAt },
  })

  revalidatePath('/expenses')
}

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  const { dbUser, venue } = await requireVenue()

  if (!input.amount || input.amount <= 0) return { error: 'Enter a valid amount.' }

  const [old] = await db.select().from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.venueId, venue.id)))
    .limit(1)
  if (!old) return { error: 'Expense not found.' }

  await db.update(expenses).set({
    category:      input.category,
    amount:        input.amount,
    vendor:        input.vendor.trim() || null,
    note:          input.note.trim() || null,
    expensedAt:    input.expensedAt,
    isRecurring:   input.isRecurring,
    recurrenceDay: input.isRecurring ? input.recurrenceDay : null,
  }).where(and(eq(expenses.id, expenseId), eq(expenses.venueId, venue.id)))

  await writeAudit({
    venueId: venue.id,
    userId:  dbUser.id,
    action:  'expense.updated',
    tableName: 'expenses',
    recordId: expenseId,
    oldData: { category: old.category, amount: old.amount, vendor: old.vendor, expensedAt: old.expensedAt },
    newData: { category: input.category, amount: input.amount, vendor: input.vendor, expensedAt: input.expensedAt },
  })

  revalidatePath('/expenses')
  return {}
}

export async function deleteExpense(expenseId: string) {
  const { dbUser, venue } = await requireVenue()

  const [old] = await db.select().from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.venueId, venue.id)))
    .limit(1)

  await db.delete(expenses).where(
    and(eq(expenses.id, expenseId), eq(expenses.venueId, venue.id))
  )

  if (old) {
    await writeAudit({
      venueId: venue.id,
      userId: dbUser.id,
      action: 'expense.deleted',
      tableName: 'expenses',
      recordId: expenseId,
      oldData: { category: old.category, amount: old.amount, vendor: old.vendor, expensedAt: old.expensedAt },
    })
  }

  revalidatePath('/expenses')
}

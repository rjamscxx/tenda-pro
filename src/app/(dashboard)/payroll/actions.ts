'use server'

import { db } from '@/lib/db'
import { payrollRuns, payrollItems, employees, expenses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

export interface PayrollItemInput {
  employeeId: string
  daysWorked: number
  grossPay: number   // cents
  deductions: number // cents
  note?: string
}

export interface PayrollRunInput {
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
  note?: string
  items: PayrollItemInput[]
}

export async function createPayrollRun(input: PayrollRunInput): Promise<{ error?: string; id?: string }> {
  try {
    const { venue } = await requireVenue()

    if (input.items.length === 0) return { error: 'Add at least one employee to the payroll run' }

    const totalGross      = input.items.reduce((s, i) => s + i.grossPay, 0)
    const totalDeductions = input.items.reduce((s, i) => s + i.deductions, 0)
    const totalNet        = totalGross - totalDeductions

    const [run] = await db.transaction(async (tx) => {
      const [r] = await tx.insert(payrollRuns).values({
        venueId:         venue.id,
        periodStart:     input.periodStart,
        periodEnd:       input.periodEnd,
        totalGross,
        totalDeductions,
        totalNet,
        note:            input.note || null,
      }).returning()

      await tx.insert(payrollItems).values(
        input.items.map(item => ({
          payrollRunId: r.id,
          employeeId:   item.employeeId,
          daysWorked:   item.daysWorked.toString(),
          grossPay:     item.grossPay,
          deductions:   item.deductions,
          netPay:       item.grossPay - item.deductions,
          note:         item.note || null,
        }))
      )

      return [r]
    })

    revalidatePath('/payroll')
    revalidatePath('/dashboard')
    return { id: run.id }
  } catch (e) {
    console.error(e)
    return { error: 'Failed to create payroll run' }
  }
}

export async function logPayrollAsExpense(runId: string): Promise<{ error?: string }> {
  try {
    const { venue, dbUser } = await requireVenue()
    const [run] = await db.select().from(payrollRuns)
      .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.venueId, venue.id)))
      .limit(1)
    if (!run) return { error: 'Payroll run not found' }

    await db.insert(expenses).values({
      venueId:     venue.id,
      userId:      dbUser.id,
      category:    'labor',
      amount:      run.totalNet,
      vendor:      'Payroll',
      note:        `Period: ${run.periodStart} – ${run.periodEnd}`,
      expensedAt:  run.periodEnd,
      isRecurring: false,
    })

    revalidatePath('/expenses')
    revalidatePath('/dashboard')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to log expense' }
  }
}

export async function deletePayrollRun(id: string): Promise<{ error?: string }> {
  try {
    const { venue } = await requireVenue()
    const [row] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).limit(1)
    if (!row || row.venueId !== venue.id) return { error: 'Not found' }
    await db.delete(payrollRuns).where(eq(payrollRuns.id, id))
    revalidatePath('/payroll')
    revalidatePath('/dashboard')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to delete' }
  }
}

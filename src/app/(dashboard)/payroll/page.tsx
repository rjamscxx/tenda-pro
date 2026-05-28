import { db } from '@/lib/db'
import { payrollRuns, payrollItems, employees } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import PayrollClient from './PayrollClient'

export const revalidate = 30
export const metadata = { title: 'Payroll — Sizzle' }

export default async function PayrollPage() {
  const { venue, account } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Payroll" hasUsedTrial={!!account.trialStartedAt} />
  }

  const [runRows, employeeRows] = await Promise.all([
    db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.venueId, venue.id))
      .orderBy(desc(payrollRuns.createdAt)),
    db
      .select()
      .from(employees)
      .where(eq(employees.venueId, venue.id))
      .orderBy(employees.fullName),
  ])

  const itemRows = runRows.length > 0
    ? await db
        .select({
          id:           payrollItems.id,
          payrollRunId: payrollItems.payrollRunId,
          daysWorked:   payrollItems.daysWorked,
          grossPay:     payrollItems.grossPay,
          deductions:   payrollItems.deductions,
          netPay:       payrollItems.netPay,
          note:         payrollItems.note,
          employeeId:   payrollItems.employeeId,
          employeeName: employees.fullName,
          employeeRole: employees.role,
        })
        .from(payrollItems)
        .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
        .where(inArray(payrollItems.payrollRunId, runRows.map(r => r.id)))
    : []

  const runs = runRows.map(r => ({
    id:              r.id,
    periodStart:     r.periodStart,
    periodEnd:       r.periodEnd,
    totalGross:      r.totalGross,
    totalDeductions: r.totalDeductions,
    totalNet:        r.totalNet,
    note:            r.note,
    createdAt:       r.createdAt,
    items:           itemRows
      .filter(i => i.payrollRunId === r.id)
      .map(i => ({
        id:           i.id,
        employeeId:   i.employeeId,
        employeeName: i.employeeName,
        employeeRole: i.employeeRole,
        daysWorked:   i.daysWorked,
        grossPay:     i.grossPay,
        deductions:   i.deductions,
        netPay:       i.netPay,
        note:         i.note,
      })),
  }))

  const activeEmployees = employeeRows
    .filter(e => e.isActive)
    .map(e => ({
      id:      e.id,
      fullName: e.fullName,
      role:     e.role,
      payType:  e.payType,
      payRate:  e.payRate,
    }))

  return (
    <div className="flex flex-col h-full">
      <PayrollClient runs={runs} activeEmployees={activeEmployees} />
    </div>
  )
}

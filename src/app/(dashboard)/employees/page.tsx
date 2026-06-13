import { db } from '@/lib/db'
import { employees, shifts } from '@/lib/db/schema'
import { eq, asc, and, gte, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import EmployeesClient from './EmployeesClient'

export const revalidate = 30
export const metadata = { title: 'Employees — Tenda Pro' }

export default async function EmployeesPage() {
  const { venue, account } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Employee Management" hasUsedTrial={!!account.trialStartedAt} />
  }

  // ISO Monday of this week, Manila-local — used for the "this week" shift chip.
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  const mondayISO = monday.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

  const [rows, shiftAgg] = await Promise.all([
    db.select()
      .from(employees)
      .where(eq(employees.venueId, venue.id))
      .orderBy(asc(employees.fullName)),
    db.select({
      employeeId: shifts.employeeId,
      shiftCount: sql<string>`count(*)`,
      hours:      sql<string>`coalesce(sum(
        case when ${shifts.status} in ('present','late')
             then ${shifts.hoursWorked}::numeric + ${shifts.otHours}::numeric - ${shifts.lateHours}::numeric
             else 0 end
      ), 0)`,
    })
      .from(shifts)
      .where(and(eq(shifts.venueId, venue.id), gte(shifts.shiftDate, mondayISO)))
      .groupBy(shifts.employeeId),
  ])

  const shiftByEmp = new Map(shiftAgg.map(s => [s.employeeId, s]))

  const data = rows.map(e => {
    const s = shiftByEmp.get(e.id)
    return {
      id:            e.id,
      fullName:      e.fullName,
      role:          e.role,
      payType:       e.payType,
      payRate:       e.payRate,
      startDate:     e.startDate,
      isActive:      e.isActive,
      contactNumber: e.contactNumber,
      weekShifts: s
        ? { count: Number(s.shiftCount), hours: Number(s.hours) }
        : { count: 0, hours: 0 },
    }
  })

  return (
    <div className="flex flex-col h-full">
      <EmployeesClient employees={data} />
    </div>
  )
}

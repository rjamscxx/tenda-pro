import { db } from '@/lib/db'
import { employees, shifts } from '@/lib/db/schema'
import { and, eq, asc, gte, desc } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import ShiftsClient from './ShiftsClient'

export const revalidate = 30
export const metadata = { title: 'Shifts — Sizzle' }

export default async function ShiftsPage() {
  const { venue, account, dbUser } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Shifts & Attendance" hasUsedTrial={!!account.trialStartedAt} />
  }

  // Last 60 days of shifts covers the longest preset filter ("last 30") plus
  // headroom for prev/next week navigation in the calendar.
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000)

  const [empRows, shiftRows] = await Promise.all([
    db.select()
      .from(employees)
      .where(eq(employees.venueId, venue.id))
      .orderBy(asc(employees.fullName)),
    db.select()
      .from(shifts)
      .where(and(
        eq(shifts.venueId, venue.id),
        gte(shifts.shiftDate, sixtyDaysAgo.toISOString().slice(0, 10)),
      ))
      .orderBy(desc(shifts.shiftDate)),
  ])

  const employeeData = empRows.map(e => ({
    id:         e.id,
    fullName:   e.fullName,
    role:       e.role,
    payType:    e.payType as 'daily'|'monthly'|'hourly',
    payRate:    e.payRate,
    contactNumber: e.contactNumber,
    isActive:   e.isActive,
  }))

  const shiftData = shiftRows.map(s => ({
    id:           s.id,
    employeeId:   s.employeeId,
    date:         s.shiftDate,                       // 'YYYY-MM-DD'
    type:         s.shiftType,
    status:       s.status,
    timeIn:       s.timeIn,
    timeOut:      s.timeOut,
    hours:        Number(s.hoursWorked),
    otHours:      Number(s.otHours),
    lateHours:    Number(s.lateHours),
    grossPay:     s.grossPay,
    note:         s.note,
  }))

  return (
    <div className="flex flex-col h-full">
      <ShiftsClient
        employees={employeeData}
        shifts={shiftData}
        isOwner={dbUser.role === 'owner'}
      />
    </div>
  )
}

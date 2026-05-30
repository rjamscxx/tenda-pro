import { db } from '@/lib/db'
import { employees, shifts } from '@/lib/db/schema'
import { eq, asc, desc, and, inArray, isNull, gte } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import EmployeesClient from './EmployeesClient'

export const revalidate = 30
export const metadata = { title: 'Employees — Sizzle' }

export default async function EmployeesPage() {
  const { venue, account, dbUser } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Employee Management" hasUsedTrial={!!account.trialStartedAt} />
  }

  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.venueId, venue.id))
    .orderBy(asc(employees.fullName))

  const empIds = rows.map(e => e.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

  const [openShifts, recentShifts] = empIds.length > 0
    ? await Promise.all([
        db.select({
          id: shifts.id, employeeId: shifts.employeeId,
          clockedInAt: shifts.clockedInAt,
        })
          .from(shifts)
          .where(and(
            eq(shifts.venueId, venue.id),
            inArray(shifts.employeeId, empIds),
            isNull(shifts.clockedOutAt),
          )),
        db.select({
          id: shifts.id, employeeId: shifts.employeeId,
          clockedInAt: shifts.clockedInAt, clockedOutAt: shifts.clockedOutAt,
        })
          .from(shifts)
          .where(and(
            eq(shifts.venueId, venue.id),
            inArray(shifts.employeeId, empIds),
            gte(shifts.clockedInAt, sevenDaysAgo),
          ))
          .orderBy(desc(shifts.clockedInAt))
          .limit(50),
      ])
    : [[], []]

  const openMap = new Map(openShifts.map(s => [s.employeeId, s]))
  const recentByEmp = new Map<string, typeof recentShifts>()
  for (const s of recentShifts) {
    if (!recentByEmp.has(s.employeeId)) recentByEmp.set(s.employeeId, [])
    recentByEmp.get(s.employeeId)!.push(s)
  }

  const data = rows.map(e => {
    const open = openMap.get(e.id)
    return {
      id:            e.id,
      fullName:      e.fullName,
      role:          e.role,
      payType:       e.payType,
      payRate:       e.payRate,
      startDate:     e.startDate,
      isActive:      e.isActive,
      contactNumber: e.contactNumber,
      openShift: open
        ? { id: open.id, clockedInAt: open.clockedInAt.toISOString() }
        : null,
      recentShifts: (recentByEmp.get(e.id) ?? []).map(s => ({
        id:            s.id,
        clockedInAt:   s.clockedInAt.toISOString(),
        clockedOutAt:  s.clockedOutAt ? s.clockedOutAt.toISOString() : null,
      })),
    }
  })

  return (
    <div className="flex flex-col h-full">
      <EmployeesClient employees={data} isOwner={dbUser.role === 'owner'} />
    </div>
  )
}

import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import EmployeesClient from './EmployeesClient'

export const metadata = { title: 'Employees — Sizzle' }

export default async function EmployeesPage() {
  const { venue, account } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Employee Management" />
  }

  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.venueId, venue.id))
    .orderBy(asc(employees.fullName))

  const data = rows.map(e => ({
    id:            e.id,
    fullName:      e.fullName,
    role:          e.role,
    payType:       e.payType,
    payRate:       e.payRate,
    startDate:     e.startDate,
    isActive:      e.isActive,
    contactNumber: e.contactNumber,
  }))

  return (
    <div className="flex flex-col h-full">
      <EmployeesClient employees={data} />
    </div>
  )
}

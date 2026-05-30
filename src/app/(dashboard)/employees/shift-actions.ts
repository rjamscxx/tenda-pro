'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { shifts, employees } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'

/**
 * Clock the given employee IN. Server-validated:
 *  - Employee must belong to the current venue.
 *  - Employee must be active.
 *  - There must be no existing open shift (the DB partial unique index also
 *    enforces this — we surface the friendly message here).
 */
export async function clockIn(employeeId: string, note?: string) {
  const { venue, dbUser } = await requireVenue()

  const [emp] = await db.select({ id: employees.id, isActive: employees.isActive })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.venueId, venue.id)))
    .limit(1)
  if (!emp)            return { error: 'Employee not found.' }
  if (!emp.isActive)   return { error: 'Employee is marked inactive.' }

  const [openShift] = await db.select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.employeeId, employeeId), isNull(shifts.clockedOutAt)))
    .limit(1)
  if (openShift) return { error: 'Already clocked in.' }

  await db.insert(shifts).values({
    venueId:     venue.id,
    employeeId,
    clockedInBy: dbUser.id,
    note:        note?.trim() || null,
  })
  revalidatePath('/employees')
  return { ok: true }
}

export async function clockOut(employeeId: string, note?: string) {
  const { venue, dbUser } = await requireVenue()

  const [openShift] = await db.select({ id: shifts.id })
    .from(shifts)
    .where(and(
      eq(shifts.venueId, venue.id),
      eq(shifts.employeeId, employeeId),
      isNull(shifts.clockedOutAt),
    ))
    .limit(1)
  if (!openShift) return { error: 'Not currently clocked in.' }

  await db.update(shifts)
    .set({
      clockedOutAt:  new Date(),
      clockedOutBy:  dbUser.id,
      note:          note?.trim() ? `${note.trim()}` : undefined,
    })
    .where(eq(shifts.id, openShift.id))

  revalidatePath('/employees')
  return { ok: true }
}

/**
 * Owner-only: delete a closed shift row (e.g. to remove an obvious mistake).
 * Open shifts can't be deleted via this — use clockOut to close them first.
 */
export async function deleteShift(shiftId: string) {
  const { venue, dbUser } = await requireVenue()
  if (dbUser.role !== 'owner') return { error: 'Only the owner can delete shifts.' }

  await db.delete(shifts).where(and(
    eq(shifts.id, shiftId),
    eq(shifts.venueId, venue.id),
  ))
  revalidatePath('/employees')
  return { ok: true }
}

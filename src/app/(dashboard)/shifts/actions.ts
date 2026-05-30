'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { shifts, employees } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import {
  SHIFT_TYPES, type ShiftTypeKey, type ShiftStatusKey,
  hourlyRateCents, computeGrossPayCents, hoursBetween,
} from './lib'

interface ShiftInput {
  employeeId:  string
  date:        string             // YYYY-MM-DD venue-local
  shiftType:   ShiftTypeKey
  status:      ShiftStatusKey
  timeIn?:     string             // 'HH:MM' (required when shiftType === 'custom')
  timeOut?:    string
  otHours?:    number
  lateHours?:  number
  note?:       string
}

/** Insert or update a shift for an employee on a given date. */
export async function saveShift(input: ShiftInput) {
  const { venue, dbUser } = await requireVenue()

  const [emp] = await db.select()
    .from(employees)
    .where(and(eq(employees.id, input.employeeId), eq(employees.venueId, venue.id)))
    .limit(1)
  if (!emp) return { error: 'Employee not found.' }

  // Resolve times + hours from the chosen preset / custom inputs.
  const preset = SHIFT_TYPES[input.shiftType]
  let timeIn: string | null  = preset.timeIn
  let timeOut: string | null = preset.timeOut
  let hours: number = preset.hours
  if (input.shiftType === 'custom') {
    if (!input.timeIn || !input.timeOut) return { error: 'Custom shift needs time in & time out.' }
    timeIn  = input.timeIn
    timeOut = input.timeOut
    hours   = hoursBetween(timeIn, timeOut)
  }

  // Status overrides — absent/leave persist a zero-hour row so the calendar
  // still shows the entry rather than a blank "+".
  if (input.status === 'absent' || input.status === 'leave') {
    hours = 0
  }

  const otHours    = Math.max(0, Math.min(12, input.otHours   ?? 0))
  const lateHours  = Math.max(0, Math.min(12, input.lateHours ?? 0))
  const hourlyCents = hourlyRateCents(emp.payType as 'daily'|'monthly'|'hourly', emp.payRate)
  const grossPay    = computeGrossPayCents(input.status, hours, otHours, lateHours, hourlyCents)

  await db.insert(shifts).values({
    venueId:     venue.id,
    employeeId:  emp.id,
    shiftDate:   input.date,
    shiftType:   input.shiftType,
    status:      input.status,
    timeIn,
    timeOut,
    hoursWorked: String(hours),
    otHours:     String(otHours),
    lateHours:   String(lateHours),
    grossPay,
    note:        input.note?.trim() || null,
    createdBy:   dbUser.id,
  }).onConflictDoUpdate({
    target: [shifts.employeeId, shifts.shiftDate],
    set: {
      shiftType:   input.shiftType,
      status:      input.status,
      timeIn,
      timeOut,
      hoursWorked: String(hours),
      otHours:     String(otHours),
      lateHours:   String(lateHours),
      grossPay,
      note:        input.note?.trim() || null,
    },
  })

  revalidatePath('/shifts')
  return { ok: true, grossPay, hours }
}

export async function deleteShift(shiftId: string) {
  const { venue } = await requireVenue()
  await db.delete(shifts).where(and(eq(shifts.id, shiftId), eq(shifts.venueId, venue.id)))
  revalidatePath('/shifts')
  return { ok: true }
}

/** Bulk clear all shifts in the active venue. Used by the "Clear log"
 *  button on the shift log — owner-only at the route level. */
export async function clearAllShifts() {
  const { venue } = await requireVenue()
  await db.delete(shifts).where(eq(shifts.venueId, venue.id))
  revalidatePath('/shifts')
  return { ok: true }
}

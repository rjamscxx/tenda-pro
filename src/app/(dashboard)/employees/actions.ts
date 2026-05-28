'use server'

import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const EmployeeSchema = z.object({
  fullName:      z.string().min(1, 'Full name is required').max(120),
  role:          z.string().max(80),
  payType:       z.enum(['daily', 'monthly', 'hourly']),
  payRate:       z.number().int().min(0),
  startDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  contactNumber: z.string().max(30).optional(),
})

export interface EmployeeInput {
  fullName: string
  role: string
  payType: 'daily' | 'monthly' | 'hourly'
  payRate: number // cents — per day (daily), per month (monthly), or per hour (hourly)
  startDate: string // YYYY-MM-DD
  contactNumber?: string
}

export async function addEmployee(input: EmployeeInput): Promise<{ error?: string }> {
  const parsed = EmployeeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  try {
    const { venue } = await requireVenue()
    await db.insert(employees).values({
      venueId:       venue.id,
      fullName:      input.fullName.trim(),
      role:          input.role.trim() || 'Staff',
      payType:       input.payType,
      payRate:       input.payRate,
      startDate:     input.startDate,
      contactNumber: input.contactNumber?.trim() || null,
    })
    revalidatePath('/employees')
    revalidatePath('/payroll')
    return {}
  } catch (e) {
    console.error('[addEmployee]', e)
    const detail = e instanceof Error ? e.message : String(e)
    return { error: `Failed to add employee: ${detail}` }
  }
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<{ error?: string }> {
  const parsed = EmployeeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  try {
    const { venue } = await requireVenue()
    const [row] = await db.select().from(employees).where(eq(employees.id, id)).limit(1)
    if (!row || row.venueId !== venue.id) return { error: 'Not found' }
    await db.update(employees).set({
      fullName:      input.fullName.trim(),
      role:          input.role.trim() || 'Staff',
      payType:       input.payType,
      payRate:       input.payRate,
      startDate:     input.startDate,
      contactNumber: input.contactNumber?.trim() || null,
      updatedAt:     new Date(),
    }).where(and(eq(employees.id, id), eq(employees.venueId, venue.id)))
    revalidatePath('/employees')
    revalidatePath('/payroll')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update employee' }
  }
}

export async function toggleEmployeeActive(id: string): Promise<{ error?: string }> {
  try {
    const { venue } = await requireVenue()
    const [row] = await db.select().from(employees).where(and(eq(employees.id, id), eq(employees.venueId, venue.id))).limit(1)
    if (!row) return { error: 'Not found' }
    await db.update(employees).set({ isActive: !row.isActive, updatedAt: new Date() }).where(and(eq(employees.id, id), eq(employees.venueId, venue.id)))
    revalidatePath('/employees')
    revalidatePath('/payroll')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update' }
  }
}

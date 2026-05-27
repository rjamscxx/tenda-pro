'use server'

import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

export interface EmployeeInput {
  fullName: string
  role: string
  payType: 'daily' | 'monthly' | 'hourly'
  payRate: number // cents — per day (daily), per month (monthly), or per hour (hourly)
  startDate: string // YYYY-MM-DD
  contactNumber?: string
}

export async function addEmployee(input: EmployeeInput): Promise<{ error?: string }> {
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
    console.error(e)
    return { error: 'Failed to add employee' }
  }
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<{ error?: string }> {
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
    }).where(eq(employees.id, id))
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
    const [row] = await db.select().from(employees).where(eq(employees.id, id)).limit(1)
    if (!row || row.venueId !== venue.id) return { error: 'Not found' }
    await db.update(employees).set({ isActive: !row.isActive, updatedAt: new Date() }).where(eq(employees.id, id))
    revalidatePath('/employees')
    revalidatePath('/payroll')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to update' }
  }
}

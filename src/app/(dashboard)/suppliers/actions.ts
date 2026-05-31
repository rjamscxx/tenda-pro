'use server'

import { db } from '@/lib/db'
import { suppliers, ingredients } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireVenue } from '@/lib/queries/auth'
import { z } from 'zod'

const SupplierSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(120),
  contactName: z.string().max(120).optional(),
  phone:       z.string().max(30).optional(),
  email:       z.string().email('Invalid email').max(120).or(z.literal('')).optional(),
  notes:       z.string().max(500).optional(),
})

export async function addSupplier(input: {
  name: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
}): Promise<{ error?: string }> {
  const parsed = SupplierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()

  await db.insert(suppliers).values({
    venueId:     venue.id,
    name:        input.name.trim(),
    contactName: input.contactName?.trim() || null,
    phone:       input.phone?.trim() || null,
    email:       input.email?.trim() || null,
    notes:       input.notes?.trim() || null,
  })

  revalidatePath('/suppliers')
  revalidatePath('/inventory')
  return {}
}

export async function updateSupplier(id: string, input: {
  name: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
}): Promise<{ error?: string }> {
  const parsed = SupplierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()

  const [row] = await db.select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.venueId, venue.id)))
    .limit(1)
  if (!row) return { error: 'Supplier not found.' }

  await db.update(suppliers)
    .set({
      name:        input.name.trim(),
      contactName: input.contactName?.trim() || null,
      phone:       input.phone?.trim() || null,
      email:       input.email?.trim() || null,
      notes:       input.notes?.trim() || null,
      updatedAt:   new Date(),
    })
    .where(eq(suppliers.id, id))

  revalidatePath('/suppliers')
  revalidatePath('/inventory')
  return {}
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  const { venue } = await requireVenue()

  const [row] = await db.select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.venueId, venue.id)))
    .limit(1)
  if (!row) return { error: 'Supplier not found.' }

  // Unlink ingredients before deleting (FK is set null on delete, but we also revalidate)
  await db.update(ingredients)
    .set({ supplierId: null })
    .where(and(eq(ingredients.supplierId, id), eq(ingredients.venueId, venue.id)))

  await db.delete(suppliers).where(eq(suppliers.id, id))

  revalidatePath('/suppliers')
  revalidatePath('/inventory')
  return {}
}

export async function assignSupplierToIngredient(ingredientId: string, supplierId: string | null): Promise<{ error?: string }> {
  const { venue } = await requireVenue()

  if (supplierId) {
    const [sup] = await db.select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.venueId, venue.id)))
      .limit(1)
    if (!sup) return { error: 'Supplier not found.' }
  }

  await db.update(ingredients)
    .set({ supplierId: supplierId ?? null, updatedAt: new Date() })
    .where(and(eq(ingredients.id, ingredientId), eq(ingredients.venueId, venue.id)))

  revalidatePath('/suppliers')
  revalidatePath('/inventory')
  return {}
}

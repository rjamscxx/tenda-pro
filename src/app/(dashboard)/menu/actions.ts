'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { ingredients } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'

interface IngredientInput {
  name: string
  unit: string
  costPerUnit: number // cents
  stockQty: number
  lowStockThreshold: number
}

export async function createIngredient(input: IngredientInput) {
  const { venue } = await requireVenue()

  if (!input.name.trim()) return { error: 'Name is required.' }

  await db.insert(ingredients).values({
    venueId: venue.id,
    name: input.name.trim(),
    unit: input.unit.trim() || 'pcs',
    costPerUnit: input.costPerUnit,
    stockQty: String(input.stockQty),
    lowStockThreshold: String(input.lowStockThreshold),
  })

  revalidatePath('/menu')
}

export async function updateIngredient(id: string, input: IngredientInput) {
  const { venue } = await requireVenue()

  await db.update(ingredients)
    .set({
      name: input.name.trim(),
      unit: input.unit.trim() || 'pcs',
      costPerUnit: input.costPerUnit,
      stockQty: String(input.stockQty),
      lowStockThreshold: String(input.lowStockThreshold),
      updatedAt: new Date(),
    })
    .where(and(eq(ingredients.id, id), eq(ingredients.venueId, venue.id)))

  revalidatePath('/menu')
}

export async function deleteIngredient(id: string) {
  const { venue } = await requireVenue()

  await db.delete(ingredients).where(
    and(eq(ingredients.id, id), eq(ingredients.venueId, venue.id))
  )

  revalidatePath('/menu')
}

'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { ingredients } from '@/lib/db/schema'
import { and, count, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro, BASIC_INGREDIENT_LIMIT } from '@/lib/plan'

interface IngredientInput {
  name: string
  unit: string
  costPerUnit: number // cents
  stockQty: number
  lowStockThreshold: number
}

export async function createIngredient(input: IngredientInput) {
  const { venue, account } = await requireVenue()

  if (!input.name.trim()) return { error: 'Name is required.' }
  if (typeof input.costPerUnit !== 'number' || !isFinite(input.costPerUnit) || input.costPerUnit < 0) return { error: 'Cost per unit must be 0 or greater.' }
  if (typeof input.stockQty !== 'number' || !isFinite(input.stockQty) || input.stockQty < 0) return { error: 'Stock quantity must be 0 or greater.' }

  if (!isPro(account)) {
    const [{ total }] = await db.select({ total: count() }).from(ingredients).where(eq(ingredients.venueId, venue.id))
    if (total >= BASIC_INGREDIENT_LIMIT) {
      return { error: `Basic plan is limited to ${BASIC_INGREDIENT_LIMIT} ingredients. Upgrade to Pro for unlimited.` }
    }
  }

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

  if (typeof input.costPerUnit !== 'number' || !isFinite(input.costPerUnit) || input.costPerUnit < 0) return { error: 'Cost per unit must be 0 or greater.' }
  if (typeof input.stockQty !== 'number' || !isFinite(input.stockQty) || input.stockQty < 0) return { error: 'Stock quantity must be 0 or greater.' }

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

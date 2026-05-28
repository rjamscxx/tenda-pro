'use server'

import { db } from '@/lib/db'
import { ingredients, auditLogs } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireVenue } from '@/lib/queries/auth'
import { z } from 'zod'

const IngredientSchema = z.object({
  name:              z.string().min(1, 'Name is required').max(120),
  unit:              z.string().min(1, 'Unit is required').max(30),
  costPerUnit:       z.number().min(0).finite(),
  lowStockThreshold: z.number().min(0).finite(),
})

const AdjustStockSchema = z.object({
  ingredientId: z.string().uuid(),
  delta:        z.number().finite(),
  movementType: z.enum(['received', 'used', 'wasted', 'adjusted']),
  reason:       z.string().max(255),
})

export async function addIngredient(input: {
  name: string
  unit: string
  costPerUnit: number
  stockQty: number
  lowStockThreshold: number
}) {
  const parsed = IngredientSchema.extend({ stockQty: z.number().min(0).finite() }).safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()

  await db.insert(ingredients).values({
    venueId:           venue.id,
    name:              input.name.trim(),
    unit:              input.unit,
    costPerUnit:       input.costPerUnit,
    stockQty:          String(input.stockQty),
    lowStockThreshold: String(input.lowStockThreshold),
  })

  revalidatePath('/inventory')
}

export async function updateIngredient(id: string, input: {
  name: string
  unit: string
  costPerUnit: number
  lowStockThreshold: number
}): Promise<{ error?: string }> {
  const parsed = IngredientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()

  const [row] = await db.select({ id: ingredients.id })
    .from(ingredients)
    .where(and(eq(ingredients.id, id), eq(ingredients.venueId, venue.id)))
    .limit(1)
  if (!row) return { error: 'Ingredient not found' }

  await db.update(ingredients).set({
    name:              input.name.trim(),
    unit:              input.unit,
    costPerUnit:       input.costPerUnit,
    lowStockThreshold: String(input.lowStockThreshold),
    updatedAt:         new Date(),
  }).where(and(eq(ingredients.id, id), eq(ingredients.venueId, venue.id)))

  revalidatePath('/inventory')
  revalidatePath('/menu')
  return {}
}

export async function deleteIngredient(ingredientId: string) {
  const { venue } = await requireVenue()

  await db
    .delete(ingredients)
    .where(and(eq(ingredients.id, ingredientId), eq(ingredients.venueId, venue.id)))

  revalidatePath('/inventory')
}

export async function bulkReceiveStock(items: Array<{ ingredientId: string; qty: number }>) {
  const { venue, authUser } = await requireVenue()
  if (items.length === 0) return { error: 'No items to receive.' }

  await db.transaction(async tx => {
    for (const item of items) {
      if (item.qty <= 0) continue
      const [ing] = await tx.select({ stockQty: ingredients.stockQty, name: ingredients.name })
        .from(ingredients)
        .where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.venueId, venue.id)))
        .limit(1)
      if (!ing) continue
      const oldQty = parseFloat(ing.stockQty)
      const newQty = oldQty + item.qty
      await tx.update(ingredients).set({ stockQty: String(newQty), updatedAt: new Date() })
        .where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.venueId, venue.id)))
      await tx.insert(auditLogs).values({
        venueId: venue.id, userId: authUser.id,
        action: 'stock.received', tableName: 'ingredients', recordId: item.ingredientId,
        oldData: { stockQty: oldQty, name: ing.name },
        newData: { stockQty: newQty, delta: item.qty, movementType: 'received' },
      })
    }
  })

  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

export async function adjustStock(input: {
  ingredientId: string
  delta: number        // positive = add, negative = remove
  movementType: 'received' | 'used' | 'wasted' | 'adjusted'
  reason: string
}) {
  const parsed = AdjustStockSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue, authUser } = await requireVenue()

  const [ingredient] = await db
    .select()
    .from(ingredients)
    .where(and(eq(ingredients.id, input.ingredientId), eq(ingredients.venueId, venue.id)))
    .limit(1)

  if (!ingredient) return { error: 'Ingredient not found' }

  const oldQty = parseFloat(ingredient.stockQty)
  const newQty = Math.max(0, oldQty + input.delta)

  await db.transaction(async tx => {
    await tx
      .update(ingredients)
      .set({ stockQty: String(newQty), updatedAt: new Date() })
      .where(and(eq(ingredients.id, input.ingredientId), eq(ingredients.venueId, venue.id)))

    await tx.insert(auditLogs).values({
      venueId:   venue.id,
      userId:    authUser.id,
      action:    'stock.adjusted',
      tableName: 'ingredients',
      recordId:  input.ingredientId,
      oldData:   { stockQty: oldQty, name: ingredient.name },
      newData:   { stockQty: newQty, delta: input.delta, movementType: input.movementType, reason: input.reason },
    })
  })

  revalidatePath('/inventory')
}

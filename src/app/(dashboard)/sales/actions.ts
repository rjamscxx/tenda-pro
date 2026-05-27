'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sales, saleItems, recipeItems, ingredients, dishes } from '@/lib/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'

interface OrderItem {
  dishId: string
  qty: number
  unitPrice: number  // cents
  unitCost: number   // cents
}

interface SaleInput {
  channel: 'dine_in' | 'takeout' | 'delivery' | 'other'
  total: number
  note: string
  items: OrderItem[]
}

export async function logSale(input: SaleInput) {
  const { dbUser, venue } = await requireVenue()
  if (!input.total || input.total <= 0) return { error: 'Enter a valid amount.' }

  await db.transaction(async tx => {
    const [saleRow] = await tx
      .insert(sales)
      .values({
        venueId: venue.id,
        userId:  dbUser.id,
        channel: input.channel,
        total:   input.total,
        note:    input.note.trim() || null,
      })
      .returning({ id: sales.id })

    if (input.items.length > 0) {
      await tx.insert(saleItems).values(
        input.items.map(item => ({
          saleId:    saleRow.id,
          dishId:    item.dishId,
          qty:       item.qty,
          unitPrice: item.unitPrice,
          unitCost:  item.unitCost,
        }))
      )

      // Auto-deduct ingredients from stock for each dish sold
      const dishIds = input.items.map(i => i.dishId)
      const recipes = await tx
        .select({
          dishId:       recipeItems.dishId,
          ingredientId: recipeItems.ingredientId,
          qty:          recipeItems.qty,
        })
        .from(recipeItems)
        .where(inArray(recipeItems.dishId, dishIds))

      // Aggregate total deduction per ingredient across all order items
      const deductions = new Map<string, number>()
      for (const recipe of recipes) {
        const sold = input.items.find(i => i.dishId === recipe.dishId)
        if (!sold) continue
        const total = Number(recipe.qty) * sold.qty
        deductions.set(recipe.ingredientId, (deductions.get(recipe.ingredientId) ?? 0) + total)
      }

      for (const [ingredientId, deduction] of deductions) {
        await tx
          .update(ingredients)
          .set({
            stockQty:  sql`GREATEST('0'::numeric, ${ingredients.stockQty}::numeric - ${String(deduction)}::numeric)`,
            updatedAt: new Date(),
          })
          .where(and(eq(ingredients.id, ingredientId), eq(ingredients.venueId, venue.id)))
      }
    }
  })

  revalidatePath('/sales')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

export async function getSaleItems(saleId: string) {
  const { venue } = await requireVenue()
  return db
    .select({
      id:        saleItems.id,
      dishName:  dishes.name,
      qty:       saleItems.qty,
      unitPrice: saleItems.unitPrice,
      unitCost:  saleItems.unitCost,
    })
    .from(saleItems)
    .leftJoin(dishes, eq(saleItems.dishId, dishes.id))
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(eq(saleItems.saleId, saleId), eq(sales.venueId, venue.id)))
}

export async function deleteSale(saleId: string) {
  const { venue } = await requireVenue()

  await db.transaction(async tx => {
    // Verify sale belongs to this venue
    const [sale] = await tx
      .select({ id: sales.id })
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.venueId, venue.id)))
      .limit(1)
    if (!sale) return

    // Fetch sale items to know what to restore
    const items = await tx
      .select({ dishId: saleItems.dishId, qty: saleItems.qty })
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId))

    if (items.length > 0) {
      const dishIds = items.map(i => i.dishId).filter(Boolean) as string[]
      const recipes = await tx
        .select({ dishId: recipeItems.dishId, ingredientId: recipeItems.ingredientId, qty: recipeItems.qty })
        .from(recipeItems)
        .where(inArray(recipeItems.dishId, dishIds))

      const restorations = new Map<string, number>()
      for (const recipe of recipes) {
        const item = items.find(i => i.dishId === recipe.dishId)
        if (!item) continue
        const total = Number(recipe.qty) * item.qty
        restorations.set(recipe.ingredientId, (restorations.get(recipe.ingredientId) ?? 0) + total)
      }

      for (const [ingredientId, amount] of restorations) {
        await tx
          .update(ingredients)
          .set({ stockQty: sql`${ingredients.stockQty}::numeric + ${String(amount)}::numeric`, updatedAt: new Date() })
          .where(and(eq(ingredients.id, ingredientId), eq(ingredients.venueId, venue.id)))
      }
    }

    await tx.delete(sales).where(eq(sales.id, saleId))
  })

  revalidatePath('/sales')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

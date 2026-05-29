'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { dishes, recipeItems, ingredients } from '@/lib/db/schema'
import { and, count, eq, inArray } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { writeAudit } from '@/lib/audit'
import { isPro, BASIC_DISH_LIMIT } from '@/lib/plan'
import { z } from 'zod'

const DishSchema = z.object({
  name:        z.string().min(1, 'Name is required.').max(120),
  description: z.string().max(400).optional(),
  category:    z.string().max(80),
  price:       z.number().int().min(1, 'Price must be greater than 0.').max(10_000_000),
})

const RecipeItemSchema = z.object({
  ingredientId: z.string().uuid(),
  qty:          z.number().positive().finite(),
})

interface DishInput {
  name: string
  description?: string
  category: string
  price: number // cents
}

export async function createDish(input: DishInput) {
  const parsed = DishSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { dbUser, venue, account } = await requireVenue()

  if (!isPro(account)) {
    const [{ total }] = await db.select({ total: count() }).from(dishes).where(eq(dishes.venueId, venue.id))
    if (total >= BASIC_DISH_LIMIT) {
      return { error: `Basic plan is limited to ${BASIC_DISH_LIMIT} dishes. Upgrade to Pro for unlimited.` }
    }
  }

  const [row] = await db.insert(dishes).values({
    venueId: venue.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category.trim() || 'Other',
    price: input.price,
  }).returning({ id: dishes.id })

  await writeAudit({
    venueId: venue.id,
    userId: dbUser.id,
    action: 'dish.created',
    tableName: 'dishes',
    recordId: row.id,
    newData: { name: input.name.trim(), category: input.category, price: input.price },
  })

  revalidatePath('/menu')
}

export async function updateDish(id: string, input: DishInput) {
  const parsed = DishSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()

  await db.update(dishes)
    .set({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category.trim() || 'Other',
      price: input.price,
      updatedAt: new Date(),
    })
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))

  revalidatePath('/menu')
}

export async function deleteDish(id: string) {
  const { dbUser, venue } = await requireVenue()

  const [old] = await db.select({ name: dishes.name, price: dishes.price })
    .from(dishes)
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))
    .limit(1)

  await db.delete(dishes).where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))

  if (old) {
    await writeAudit({
      venueId: venue.id,
      userId: dbUser.id,
      action: 'dish.deleted',
      tableName: 'dishes',
      recordId: id,
      oldData: { name: old.name, price: old.price },
    })
  }

  revalidatePath('/menu')
}

export async function toggleDishActive(id: string) {
  const { venue } = await requireVenue()

  const [dish] = await db.select({ isActive: dishes.isActive })
    .from(dishes)
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))
    .limit(1)
  if (!dish) return { error: 'Dish not found.' }

  await db.update(dishes)
    .set({ isActive: !dish.isActive, updatedAt: new Date() })
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))

  revalidatePath('/menu')
}

export async function toggleSoldOut(id: string) {
  const { venue } = await requireVenue()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

  const [dish] = await db.select({ soldOutDate: dishes.soldOutDate })
    .from(dishes)
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))
    .limit(1)
  if (!dish) return { error: 'Dish not found.' }

  const isSoldOutToday = dish.soldOutDate === today
  await db.update(dishes)
    .set({ soldOutDate: isSoldOutToday ? null : today, updatedAt: new Date() })
    .where(and(eq(dishes.id, id), eq(dishes.venueId, venue.id)))

  revalidatePath('/menu')
  revalidatePath('/sales')
}

export async function saveRecipe(dishId: string, items: { ingredientId: string; qty: number }[]) {
  if (!z.string().uuid().safeParse(dishId).success) return { error: 'Invalid dish ID.' }
  const parsedItems = z.array(RecipeItemSchema).safeParse(items)
  if (!parsedItems.success) return { error: parsedItems.error.issues[0]?.message ?? 'Invalid recipe items.' }
  const { venue } = await requireVenue()

  const [dish] = await db.select().from(dishes)
    .where(and(eq(dishes.id, dishId), eq(dishes.venueId, venue.id)))
    .limit(1)
  if (!dish) return { error: 'Dish not found.' }

  await db.delete(recipeItems).where(eq(recipeItems.dishId, dishId))

  if (items.length > 0) {
    // Verify every ingredient ID belongs to this venue before linking
    const ingredientIds = items.map(i => i.ingredientId)
    const venueIngredients = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(and(eq(ingredients.venueId, venue.id), inArray(ingredients.id, ingredientIds)))
    const validIds = new Set(venueIngredients.map(r => r.id))
    const safeItems = items.filter(item => validIds.has(item.ingredientId))
    if (safeItems.length < items.length) return { error: 'One or more ingredients are invalid.' }

    await db.insert(recipeItems).values(
      safeItems.map(item => ({ dishId, ingredientId: item.ingredientId, qty: String(item.qty) }))
    )
  }

  revalidatePath('/menu')
}

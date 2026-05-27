'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { dishes, recipeItems } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { writeAudit } from '@/lib/audit'

interface DishInput {
  name: string
  category: string
  price: number // cents
}

export async function createDish(input: DishInput) {
  const { dbUser, venue } = await requireVenue()
  if (!input.name.trim()) return { error: 'Name is required.' }

  const [row] = await db.insert(dishes).values({
    venueId: venue.id,
    name: input.name.trim(),
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
  const { venue } = await requireVenue()

  await db.update(dishes)
    .set({ name: input.name.trim(), category: input.category.trim() || 'Other', price: input.price, updatedAt: new Date() })
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
  const { venue } = await requireVenue()

  const [dish] = await db.select().from(dishes)
    .where(and(eq(dishes.id, dishId), eq(dishes.venueId, venue.id)))
    .limit(1)
  if (!dish) return { error: 'Dish not found.' }

  await db.delete(recipeItems).where(eq(recipeItems.dishId, dishId))

  if (items.length > 0) {
    await db.insert(recipeItems).values(
      items.map(item => ({ dishId, ingredientId: item.ingredientId, qty: String(item.qty) }))
    )
  }

  revalidatePath('/menu')
}

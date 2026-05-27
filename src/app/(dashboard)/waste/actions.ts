'use server'

import { db } from '@/lib/db'
import { wasteLogs, ingredients } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

interface WasteInput {
  ingredientId: string
  qty: number
  reason: 'spoilage' | 'overcooked' | 'dropped' | 'expired' | 'other'
  note: string
  wastedAt: string // YYYY-MM-DD
}

export async function logWaste(input: WasteInput): Promise<{ error?: string }> {
  try {
    const { venue, dbUser } = await requireVenue()

    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, input.ingredientId))
      .limit(1)

    if (!ingredient || ingredient.venueId !== venue.id) {
      return { error: 'Ingredient not found' }
    }

    const estimatedCost = Math.round(ingredient.costPerUnit * input.qty)

    await db.insert(wasteLogs).values({
      venueId:        venue.id,
      userId:         dbUser.id,
      ingredientId:   ingredient.id,
      ingredientName: ingredient.name,
      qty:            input.qty.toString(),
      unit:           ingredient.unit,
      reason:         input.reason,
      estimatedCost,
      note:           input.note || null,
      wastedAt:       input.wastedAt,
    })

    revalidatePath('/waste')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to log waste' }
  }
}

export async function deleteWaste(id: string): Promise<{ error?: string }> {
  try {
    const { venue } = await requireVenue()
    const [row] = await db.select().from(wasteLogs).where(eq(wasteLogs.id, id)).limit(1)
    if (!row || row.venueId !== venue.id) return { error: 'Not found' }
    await db.delete(wasteLogs).where(eq(wasteLogs.id, id))
    revalidatePath('/waste')
    revalidatePath('/dashboard')
    return {}
  } catch (e) {
    console.error(e)
    return { error: 'Failed to delete' }
  }
}

import { db } from '@/lib/db'
import { sales, saleItems, recipeItems, ingredients } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'

export interface IngredientForecast {
  ingredientId: string
  avgDailyConsumption: number    // in stock units (e.g. kg, L) per day
  daysRemaining:       number | null  // null when there's no consumption signal
  stockQty:            number
}

const WINDOW_DAYS = 14

/**
 * For each ingredient owned by a venue, estimate how many days of stock are
 * left based on the last 14 days of recipe-driven consumption from sales.
 *
 * Returns a Map keyed by ingredientId. Ingredients with no consumption in the
 * window get daysRemaining = null (we can't forecast yet).
 */
export async function computeInventoryForecast(venueId: string): Promise<Map<string, IngredientForecast>> {
  const since = new Date()
  since.setDate(since.getDate() - WINDOW_DAYS)

  // Sum up qty consumed per ingredient via:
  //   sale_items × recipe_items × qty multiplier
  // over the last WINDOW_DAYS, for this venue's sales only.
  const consumption = await db
    .select({
      ingredientId: recipeItems.ingredientId,
      totalUsed:    sql<string>`sum(${saleItems.qty}::numeric * ${recipeItems.qty}::numeric)`,
    })
    .from(saleItems)
    .innerJoin(sales,       eq(saleItems.saleId, sales.id))
    .innerJoin(recipeItems, eq(recipeItems.dishId, saleItems.dishId))
    .where(and(eq(sales.venueId, venueId), gte(sales.soldAt, since)))
    .groupBy(recipeItems.ingredientId)

  // Current stock for every ingredient at this venue
  const stocks = await db
    .select({
      id: ingredients.id,
      stockQty: ingredients.stockQty,
    })
    .from(ingredients)
    .where(eq(ingredients.venueId, venueId))

  const consumptionMap = new Map<string, number>()
  for (const c of consumption) {
    consumptionMap.set(c.ingredientId, Number(c.totalUsed))
  }

  const result = new Map<string, IngredientForecast>()
  for (const s of stocks) {
    const totalUsed = consumptionMap.get(s.id) ?? 0
    const avgDaily  = totalUsed / WINDOW_DAYS
    const stockQty  = parseFloat(s.stockQty)
    const daysRemaining = avgDaily > 0 ? stockQty / avgDaily : null

    result.set(s.id, {
      ingredientId: s.id,
      avgDailyConsumption: avgDaily,
      daysRemaining,
      stockQty,
    })
  }

  return result
}

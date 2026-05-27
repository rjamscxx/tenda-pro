import { db } from '@/lib/db'
import { ingredients, dishes, sales, saleItems } from '@/lib/db/schema'
import { eq, asc, gte, and, desc, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import MenuClient from './MenuClient'

export const revalidate = 30
export const metadata = { title: 'Menu — Sizzle' }

export default async function MenuPage() {
  const { venue, account } = await requireVenue()
  const pro = isPro(account)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [ingredientRows, dishRows, salesVolumeRows] = await Promise.all([
    db
      .select()
      .from(ingredients)
      .where(eq(ingredients.venueId, venue.id))
      .orderBy(asc(ingredients.name)),
    db.query.dishes.findMany({
      where: eq(dishes.venueId, venue.id),
      orderBy: [asc(dishes.name)],
      with: {
        recipeItems: {
          with: { ingredient: true },
        },
      },
    }),
    db
      .select({
        dishId:       saleItems.dishId,
        totalQty:     sql<string>`coalesce(sum(${saleItems.qty}), 0)::text`,
        totalRevenue: sql<string>`coalesce(sum(${saleItems.qty} * ${saleItems.unitPrice}), 0)::text`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(eq(sales.venueId, venue.id), gte(sales.soldAt, thirtyDaysAgo)))
      .groupBy(saleItems.dishId)
      .orderBy(desc(sql`sum(${saleItems.qty})`)),
  ])

  const ingredientData = ingredientRows.map(i => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    costPerUnit: i.costPerUnit,
    stockQty: i.stockQty,
    lowStockThreshold: i.lowStockThreshold,
  }))

  const dishData = dishRows.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    price: d.price,
    isActive: d.isActive,
    soldOutDate: d.soldOutDate,
    recipeItems: d.recipeItems
      .filter(ri => ri.ingredient != null)
      .map(ri => ({
        ingredientId: ri.ingredientId,
        qty: Number(ri.qty),
        ingredient: {
          id: ri.ingredient!.id,
          name: ri.ingredient!.name,
          unit: ri.ingredient!.unit,
          costPerUnit: ri.ingredient!.costPerUnit,
        },
      })),
  }))

  const salesVolumeMap = new Map<string, { qty: number; revenue: number }>(
    salesVolumeRows
      .filter((r): r is typeof r & { dishId: string } => r.dishId !== null)
      .map(r => [r.dishId, { qty: Number(r.totalQty), revenue: Number(r.totalRevenue) }])
  )

  return (
    <div className="flex flex-col h-full">
      <MenuClient ingredients={ingredientData} dishes={dishData} salesVolume={salesVolumeMap} isPro={pro} />
    </div>
  )
}

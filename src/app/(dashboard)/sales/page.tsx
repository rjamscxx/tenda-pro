import { db } from '@/lib/db'
import { sales, dishes, saleItems } from '@/lib/db/schema'
import { eq, desc, and, asc, inArray, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import SalesClient from './SalesClient'

export const metadata = { title: 'Sales — Sizzle' }

export default async function SalesPage() {
  const { venue } = await requireVenue()

  const [salesRows, dishRows] = await Promise.all([
    db.select().from(sales).where(eq(sales.venueId, venue.id)).orderBy(desc(sales.soldAt)),
    db.query.dishes.findMany({
      where: and(eq(dishes.venueId, venue.id), eq(dishes.isActive, true)),
      with: { recipeItems: { with: { ingredient: true } } },
      orderBy: [asc(dishes.category), asc(dishes.name)],
    }),
  ])

  // Count saleItems per sale for table display
  const itemCounts = salesRows.length > 0
    ? await db
        .select({ saleId: saleItems.saleId, count: sql<string>`count(*)::text` })
        .from(saleItems)
        .where(inArray(saleItems.saleId, salesRows.map(s => s.id)))
        .groupBy(saleItems.saleId)
    : []
  const itemCountMap = new Map(itemCounts.map(r => [r.saleId, Number(r.count)]))

  const data = salesRows.map(s => ({
    id:        s.id,
    channel:   s.channel,
    total:     s.total,
    note:      s.note,
    soldAt:    s.soldAt,
    itemCount: itemCountMap.get(s.id) ?? 0,
  }))

  // Precompute food cost per dish from recipe
  const dishOptions = dishRows.map(d => {
    const cost = d.recipeItems
      .filter(ri => ri.ingredient != null)
      .reduce((sum, ri) => sum + Number(ri.qty) * ri.ingredient!.costPerUnit, 0)
    return {
      id:          d.id,
      name:        d.name,
      category:    d.category,
      price:       d.price,
      foodCost:    Math.round(cost),
      soldOutDate: d.soldOutDate ?? null,
    }
  })

  return (
    <div className="flex flex-col h-full">
      <SalesClient sales={data} dishes={dishOptions} />
    </div>
  )
}

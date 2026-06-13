import { db } from '@/lib/db'
import { sales, dishes, saleItems } from '@/lib/db/schema'
import { eq, desc, and, asc, inArray } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import SalesClient from './SalesClient'

export const metadata = { title: 'Sales — Tenda' }

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

  // Fetch all sale items in one join so each row can render its breakdown
  // inline without an additional click.
  const itemRows = salesRows.length > 0
    ? await db
        .select({
          saleId:    saleItems.saleId,
          itemId:    saleItems.id,
          dishName:  dishes.name,
          qty:       saleItems.qty,
          unitPrice: saleItems.unitPrice,
          unitCost:  saleItems.unitCost,
        })
        .from(saleItems)
        .leftJoin(dishes, eq(dishes.id, saleItems.dishId))
        .where(inArray(saleItems.saleId, salesRows.map(s => s.id)))
    : []
  const itemsBySale = new Map<string, typeof itemRows>()
  for (const row of itemRows) {
    if (!itemsBySale.has(row.saleId)) itemsBySale.set(row.saleId, [])
    itemsBySale.get(row.saleId)!.push(row)
  }

  const data = salesRows.map(s => {
    const items = itemsBySale.get(s.id) ?? []
    return {
      id:           s.id,
      channel:      s.channel,
      total:        s.total,
      note:         s.note,
      customerName: s.customerName,
      soldAt:       s.soldAt,
      isPaid:       s.isPaid,
      items: items.map(i => ({
        id:        i.itemId,
        dishName:  i.dishName,
        qty:       i.qty,
        unitPrice: i.unitPrice,
        unitCost:  i.unitCost,
      })),
    }
  })

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

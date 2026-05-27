import { db } from '@/lib/db'
import { dishes } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import POSClient from './POSClient'

export const metadata = { title: 'POS — Sizzle' }

export default async function POSPage() {
  const { venue } = await requireVenue()

  const dishRows = await db.query.dishes.findMany({
    where: and(eq(dishes.venueId, venue.id), eq(dishes.isActive, true)),
    with: { recipeItems: { with: { ingredient: true } } },
    orderBy: [asc(dishes.category), asc(dishes.name)],
  })

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
    <div className="flex h-full">
      <POSClient dishes={dishOptions} venueName={venue.name} vatRegistered={venue.vatRegistered} />
    </div>
  )
}

import { db } from '@/lib/db'
import { ingredients, suppliers, auditLogs } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro, isPremium, BASIC_INGREDIENT_LIMIT } from '@/lib/plan'
import { computeInventoryForecast } from '@/lib/queries/inventory-forecast'
import InventoryClient from './InventoryClient'

export const revalidate = 30
export const metadata = { title: 'Inventory — Tenda Pro' }

export default async function InventoryPage() {
  const { venue, account } = await requireVenue()
  const pro = isPro(account)
  const premium = isPremium(account)
  const isBasic = !pro

  const [allIngredients, allMovements, forecast] = await Promise.all([
    db.select({
        id:                ingredients.id,
        name:              ingredients.name,
        unit:              ingredients.unit,
        costPerUnit:       ingredients.costPerUnit,
        stockQty:          ingredients.stockQty,
        lowStockThreshold: ingredients.lowStockThreshold,
        supplierId:        ingredients.supplierId,
        supplierName:      suppliers.name,
      })
      .from(ingredients)
      .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id))
      .where(eq(ingredients.venueId, venue.id))
      .orderBy(ingredients.name),
    db.select()
      .from(auditLogs)
      .where(and(eq(auditLogs.venueId, venue.id), eq(auditLogs.action, 'stock.adjusted')))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200),
    // Premium-only forecast — query is small and Drizzle short-circuits if the
    // join returns no rows so it's safe to call regardless and gate the UI.
    premium ? computeInventoryForecast(venue.id) : Promise.resolve(new Map()),
  ])

  const rows = allIngredients.map(i => {
    const fc = forecast.get(i.id)
    return {
      id:                i.id,
      name:              i.name,
      unit:              i.unit,
      stockQty:          parseFloat(i.stockQty),
      lowStockThreshold: parseFloat(i.lowStockThreshold),
      costPerUnit:       i.costPerUnit,
      supplierId:        i.supplierId ?? null,
      supplierName:      i.supplierName ?? null,
      daysRemaining:     fc?.daysRemaining ?? null,
    }
  })

  const movements = allMovements.map(m => ({
    id:        m.id,
    createdAt: m.createdAt.toISOString(),
    oldData:   m.oldData as { stockQty: number; name: string } | null,
    newData:   m.newData as { stockQty: number; delta: number; movementType: string; reason: string } | null,
  }))

  return (
    <div className="flex flex-col h-full">
      <InventoryClient ingredients={rows} movements={movements} isPro={pro} isPremium={premium} isBasic={isBasic} ingredientLimit={BASIC_INGREDIENT_LIMIT} />
    </div>
  )
}

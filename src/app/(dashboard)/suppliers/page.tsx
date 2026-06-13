import { db } from '@/lib/db'
import { suppliers, ingredients } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import SuppliersClient from './SuppliersClient'

export const revalidate = 30
export const metadata = { title: 'Suppliers — Tenda' }

export default async function SuppliersPage() {
  const { venue } = await requireVenue()

  const [allSuppliers, allIngredients] = await Promise.all([
    db
      .select({
        id:          suppliers.id,
        name:        suppliers.name,
        contactName: suppliers.contactName,
        phone:       suppliers.phone,
        email:       suppliers.email,
        notes:       suppliers.notes,
        ingredientCount: sql<number>`(
          select count(*) from ingredients
          where ingredients.supplier_id = ${suppliers.id}
        )`.mapWith(Number),
      })
      .from(suppliers)
      .where(eq(suppliers.venueId, venue.id))
      .orderBy(suppliers.name),
    db
      .select({
        id:           ingredients.id,
        name:         ingredients.name,
        unit:         ingredients.unit,
        supplierId:   ingredients.supplierId,
        supplierName: suppliers.name,
      })
      .from(ingredients)
      .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id))
      .where(eq(ingredients.venueId, venue.id))
      .orderBy(ingredients.name),
  ])

  return (
    <div className="flex flex-col h-full">
      <SuppliersClient
        suppliers={allSuppliers}
        ingredients={allIngredients.map(i => ({
          id:           i.id,
          name:         i.name,
          unit:         i.unit,
          supplierId:   i.supplierId ?? null,
          supplierName: i.supplierName ?? null,
        }))}
      />
    </div>
  )
}

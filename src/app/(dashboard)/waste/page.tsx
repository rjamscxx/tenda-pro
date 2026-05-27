import { db } from '@/lib/db'
import { wasteLogs, ingredients } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import WasteClient from './WasteClient'

export const metadata = { title: 'Waste Log — Sizzle' }

export default async function WastePage() {
  const { venue, account } = await requireVenue()

  if (!isPro(account)) {
    return <ProLockPage feature="Waste Log" />
  }

  const [rows, ingredientRows] = await Promise.all([
    db
      .select()
      .from(wasteLogs)
      .where(eq(wasteLogs.venueId, venue.id))
      .orderBy(desc(wasteLogs.wastedAt), desc(wasteLogs.createdAt)),
    db
      .select({
        id:          ingredients.id,
        name:        ingredients.name,
        unit:        ingredients.unit,
        costPerUnit: ingredients.costPerUnit,
      })
      .from(ingredients)
      .where(eq(ingredients.venueId, venue.id))
      .orderBy(ingredients.name),
  ])

  const data = rows.map(w => ({
    id:             w.id,
    ingredientName: w.ingredientName,
    qty:            w.qty,
    unit:           w.unit,
    reason:         w.reason,
    estimatedCost:  w.estimatedCost,
    note:           w.note,
    wastedAt:       w.wastedAt,
  }))

  const ingredientOptions = ingredientRows.map(i => ({
    id:          i.id,
    name:        i.name,
    unit:        i.unit,
    costPerUnit: i.costPerUnit,
  }))

  return (
    <div className="flex flex-col h-full">
      <WasteClient wasteLogs={data} ingredients={ingredientOptions} />
    </div>
  )
}

import { db } from '@/lib/db'
import { dishes, ingredients } from '@/lib/db/schema'
import { eq, asc, and, count } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import Link from 'next/link'
import POSClient from './POSClient'

export const revalidate = 30
export const metadata = { title: 'POS — Tenda Pro' }

export default async function POSPage() {
  const { venue } = await requireVenue()

  const [dishRows, [ingredientCount]] = await Promise.all([
    db.query.dishes.findMany({
      where: and(eq(dishes.venueId, venue.id), eq(dishes.isActive, true)),
      with: { recipeItems: { with: { ingredient: true } } },
      orderBy: [asc(dishes.category), asc(dishes.name)],
    }),
    db.select({ c: count() }).from(ingredients).where(eq(ingredients.venueId, venue.id)),
  ])

  // No dishes yet — show a focused setup prompt instead of the empty POS
  if (dishRows.length === 0) {
    const hasIngredients = ingredientCount.c > 0
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-hair flex items-center justify-center mx-auto">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="text-ink-3">
              <rect x="3" y="7" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M3 12h24" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 18h4M17 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-ink tracking-tight">POS needs a menu first</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              {hasIngredients
                ? 'You have ingredients but no dishes yet. Create your menu items and the POS will be ready to go.'
                : 'Add your ingredients and build your menu — the POS unlocks once you have at least one active dish.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/menu"
              className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold"
            >
              {hasIngredients ? 'Create dishes →' : 'Set up menu →'}
            </Link>
            <Link
              href="/sales"
              className="px-5 py-2.5 rounded-xl border border-hair text-sm text-ink-2 hover:border-accent hover:text-ink transition-colors"
            >
              Log sale manually
            </Link>
          </div>

          <p className="text-[11px] text-ink-4">
            The manual sales form on the Sales page works without a menu.
          </p>
        </div>
      </div>
    )
  }

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

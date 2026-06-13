import { db } from '@/lib/db'
import { ingredients, dishes } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { isPro, BASIC_DISH_LIMIT, BASIC_INGREDIENT_LIMIT } from '@/lib/plan'
import { canSeeFinancials } from '@/lib/permissions'
import MenuClient from './MenuClient'

export const revalidate = 30
export const metadata = { title: 'Menu — Tenda' }

export default async function MenuPage() {
  const { venue, account, dbUser } = await requireVenue()
  const isBasic = !isPro(account)
  const showFin = canSeeFinancials(dbUser)

  const [ingredientRows, dishRows] = await Promise.all([
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
    description: d.description,
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

  return (
    <div className="flex flex-col h-full">
      <MenuClient
        ingredients={ingredientData}
        dishes={dishData}
        venueId={venue.id}
        venueName={venue.name}
        isBasic={isBasic}
        showFinancials={showFin}
        dishLimit={BASIC_DISH_LIMIT}
        ingredientLimit={BASIC_INGREDIENT_LIMIT}
      />
    </div>
  )
}

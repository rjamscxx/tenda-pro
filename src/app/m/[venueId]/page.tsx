import { db } from '@/lib/db'
import { dishes, venues } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export default async function PublicMenuPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params

  const [venueRow, dishRows] = await Promise.all([
    db.select({ id: venues.id, name: venues.name })
      .from(venues).where(eq(venues.id, venueId)).limit(1),
    db.select({ id: dishes.id, name: dishes.name, category: dishes.category, price: dishes.price, soldOutDate: dishes.soldOutDate })
      .from(dishes)
      .where(and(eq(dishes.venueId, venueId), eq(dishes.isActive, true)))
      .orderBy(asc(dishes.category), asc(dishes.name)),
  ])

  if (!venueRow[0]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink-3 text-sm">
        Menu not found.
      </div>
    )
  }

  const venue = venueRow[0]
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

  const grouped = dishRows.reduce<Record<string, typeof dishRows>>((acc, dish) => {
    const cat = dish.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(dish)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans" data-theme="sage-dark">

      {/* Header */}
      <div className="bg-surface border-b border-hair px-6 py-10 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-4">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11" stroke="var(--canvas)" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M7 6V2M5 4l2-2 2 2" stroke="var(--canvas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{venue.name}</h1>
        <p className="mt-1 text-ink-4 text-sm">Menu</p>
      </div>

      {/* Menu content */}
      <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
        {categories.length === 0 && (
          <p className="text-center text-ink-4 py-12 text-sm">No menu items available.</p>
        )}
        {categories.map(cat => (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{cat}</span>
              <div className="flex-1 h-px bg-hair" />
            </div>
            <div className="space-y-0.5">
              {grouped[cat].map(dish => {
                const soldOut = dish.soldOutDate === today
                return (
                  <div
                    key={dish.id}
                    className={`flex items-baseline justify-between py-3 border-b border-hair/50 last:border-0 ${soldOut ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className={`text-sm font-medium text-ink truncate ${soldOut ? 'line-through' : ''}`}>
                        {dish.name}
                      </span>
                      {soldOut && (
                        <span className="text-[10px] text-ink-4 font-normal shrink-0">sold out</span>
                      )}
                    </div>
                    <span className="ml-4 shrink-0 tabular-nums text-sm font-semibold text-ink-2">
                      ₱{(dish.price / 100).toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-hair">
        <p className="text-[11px] text-ink-4">Powered by <span className="text-accent font-medium">Sizzle</span> · Prices in PHP</p>
      </div>
    </div>
  )
}

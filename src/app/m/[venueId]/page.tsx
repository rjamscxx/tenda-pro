import { db } from '@/lib/db'
import { dishes, venues } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { Metadata } from 'next'
import OrderClient from './OrderClient'

export const revalidate = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: { params: Promise<{ venueId: string }> }): Promise<Metadata> {
  const { venueId } = await params
  if (!UUID_RE.test(venueId)) return { title: 'Menu' }
  const [venue] = await db.select({ name: venues.name }).from(venues).where(eq(venues.id, venueId)).limit(1)
  return {
    title: venue ? `${venue.name} — Menu` : 'Menu',
    description: venue ? `View the live menu for ${venue.name}.` : undefined,
  }
}

// Title-case a category string so user-typed "mains", "Mains", "MAINS" all
// render consistently as "Mains".
function titleCase(s: string) {
  return s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

// Order categories the way a real menu would: appetizers / starters first,
// then mains, sides, drinks, desserts, then anything else alphabetically.
const CATEGORY_ORDER = [
  'starter', 'starters', 'appetizer', 'appetizers',
  'main', 'mains', 'entree', 'entrees',
  'side', 'sides',
  'drink', 'drinks', 'beverage', 'beverages', 'coffee', 'tea',
  'dessert', 'desserts', 'pastry', 'pastries',
]
function categoryRank(cat: string) {
  const k = cat.toLowerCase().trim()
  const idx = CATEGORY_ORDER.indexOf(k)
  return idx >= 0 ? idx : 999
}

export default async function PublicMenuPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params

  if (!UUID_RE.test(venueId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink-3 text-sm">
        Menu not found.
      </div>
    )
  }

  const [venueRow, dishRows] = await Promise.all([
    db.select({
      id: venues.id,
      name: venues.name,
      menuTheme: venues.menuTheme,
      onlineOrderingEnabled: venues.onlineOrderingEnabled,
      gcashNumber: venues.gcashNumber,
      gcashName: venues.gcashName,
    })
      .from(venues).where(eq(venues.id, venueId)).limit(1),
    db.select({
      id: dishes.id,
      name: dishes.name,
      description: dishes.description,
      category: dishes.category,
      price: dishes.price,
      soldOutDate: dishes.soldOutDate,
    })
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
  const theme = venue.menuTheme || 'ember'

  // Group dishes by Title-Cased category, then sort categories by intent
  const grouped = dishRows.reduce<Record<string, typeof dishRows>>((acc, dish) => {
    const cat = titleCase((dish.category || 'Other').trim())
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(dish)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort((a, b) => {
    const ra = categoryRank(a), rb = categoryRank(b)
    if (ra !== rb) return ra - rb
    return a.localeCompare(b)
  })

  const totalAvailable = dishRows.filter(d => d.soldOutDate !== today).length

  // Online ordering ON → render the interactive cart/checkout client. The
  // public menu stays read-only otherwise (below).
  if (venue.onlineOrderingEnabled) {
    return (
      <OrderClient
        theme={theme}
        venueId={venue.id}
        venueName={venue.name}
        gcashNumber={venue.gcashNumber}
        gcashName={venue.gcashName}
        totalAvailable={totalAvailable}
        categories={categories.map(cat => ({
          name: cat,
          dishes: grouped[cat].map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            soldOut: d.soldOutDate === today,
          })),
        }))}
      />
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans antialiased" data-theme={theme}>

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <header className="relative border-b border-hair overflow-hidden">
        {/* Subtle gradient flourish */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-40 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 0%, var(--accent) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6 pt-14 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-hair mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold">Live menu</span>
          </div>

          <h1 className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tighter text-ink leading-[0.95]">
            {venue.name}
          </h1>

          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="h-px w-10 bg-hair" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-ink-4 font-medium">Menu</span>
            <span className="h-px w-10 bg-hair" />
          </div>

          <p className="mt-4 text-xs text-ink-4">
            {totalAvailable} {totalAvailable === 1 ? 'item' : 'items'} available today
          </p>
        </div>
      </header>

      {/* ── Menu body ───────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-14">

        {dishRows.length === 0 && (
          <p className="text-center text-ink-4 py-12 text-sm">
            The menu is being prepared. Please check back later.
          </p>
        )}

        {categories.map(cat => (
          <section key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-serif text-[18px] font-medium text-ink tracking-tight">
                {cat}
              </span>
              <div className="flex-1 h-px bg-hair" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-4 tabular">
                {grouped[cat].length}
              </span>
            </div>

            {/* Dishes */}
            <div className="space-y-5">
              {grouped[cat].map(dish => {
                const soldOut = dish.soldOutDate === today
                return (
                  <article
                    key={dish.id}
                    className={`group transition-opacity ${soldOut ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-baseline gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className={`font-serif text-[16px] font-semibold text-ink leading-snug tracking-tight ${soldOut ? 'line-through' : ''}`}>
                            {dish.name}
                          </h3>
                          {soldOut && (
                            <span className="text-[10px] uppercase tracking-widest text-warn font-semibold shrink-0">
                              Sold out
                            </span>
                          )}
                        </div>
                        {dish.description && (
                          <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Dotted leader + price (classic menu style) */}
                      <div className="hidden sm:flex flex-1 items-end gap-2 pb-1 min-w-0">
                        <span className="flex-1 border-b border-dotted border-hair" />
                      </div>

                      <span className={`shrink-0 font-serif text-[15px] font-semibold text-ink tabular-nums ${soldOut ? 'line-through' : ''}`}>
                        ₱{(dish.price / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-hair">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center space-y-3">
          <p className="text-[10px] text-ink-4 uppercase tracking-[0.25em]">
            Prices in Philippine Peso · Subject to change
          </p>
          <p className="text-[10px] text-ink-4">
            powered by{' '}
            <a
              href="https://tenda.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline underline-offset-2"
            >
              Tenda Pro
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

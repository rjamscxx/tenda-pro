'use client'

import { useMemo, useState } from 'react'
import { createOnlineOrder } from './actions'

// ── Types ──────────────────────────────────────────────────────────────────

interface MenuDish {
  id: string
  name: string
  description: string | null
  price: number // cents
  soldOut: boolean
}

interface MenuCategory {
  name: string
  dishes: MenuDish[]
}

interface Props {
  theme: string
  venueId: string
  venueName: string
  gcashNumber: string | null
  gcashName: string | null
  totalAvailable: number
  categories: MenuCategory[]
}

type Step = 'review' | 'details' | 'pay' | 'done'

// Pesos from cents with thousands separators, no decimals (menu prices are whole pesos).
function peso(cents: number) {
  return '₱' + (cents / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })
}

export default function OrderClient({
  theme,
  venueId,
  venueName,
  gcashNumber,
  gcashName,
  totalAvailable,
  categories,
}: Props) {
  // cart: dishId → qty
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState<Step>('review')

  // checkout fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [channel, setChannel] = useState<'takeout' | 'delivery'>('takeout')
  const [note, setNote] = useState('')
  const [paymentRef, setPaymentRef] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState<{ total: number; itemCount: number } | null>(null)

  // Flat dish lookup for the cart line items + totals.
  const dishById = useMemo(() => {
    const m = new Map<string, MenuDish>()
    for (const c of categories) for (const d of c.dishes) m.set(d.id, d)
    return m
  }, [categories])

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([dishId, qty]) => ({ dish: dishById.get(dishId)!, qty }))
        .filter(l => l.dish),
    [cart, dishById],
  )

  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0)
  // Client-side total is display-only — the server recomputes from DB prices.
  const total = cartLines.reduce((s, l) => s + l.dish.price * l.qty, 0)

  const paymentReady = !!(gcashNumber && gcashNumber.trim())

  function setQty(dishId: string, qty: number) {
    setCart(prev => {
      const next = { ...prev }
      if (qty <= 0) delete next[dishId]
      else next[dishId] = Math.min(50, qty)
      return next
    })
  }

  function openSheet() {
    if (itemCount === 0) return
    setStep('review')
    setError('')
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    // If the order completed, also reset to a clean slate.
    if (step === 'done') {
      setStep('review')
      setConfirmation(null)
    }
  }

  function goToDetails() {
    if (cartLines.length === 0) { setError('Your cart is empty.'); return }
    setError('')
    setStep('details')
  }

  function goToPay() {
    if (customerName.trim().length < 2) { setError('Please enter your name.'); return }
    if (customerPhone.replace(/\D/g, '').length < 7) { setError('Please enter a valid phone number.'); return }
    setError('')
    setStep('pay')
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    const result = await createOnlineOrder(venueId, {
      items: cartLines.map(l => ({ dishId: l.dish.id, qty: l.qty })),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      channel,
      note: note.trim() || undefined,
      paymentRef: paymentRef.trim() || undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setConfirmation({ total: result.total, itemCount: result.itemCount })
    setCart({})
    setCustomerName('')
    setCustomerPhone('')
    setNote('')
    setPaymentRef('')
    setChannel('takeout')
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans antialiased" data-theme={theme}>
      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <header className="relative border-b border-hair overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-40 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, var(--accent) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-2xl mx-auto px-6 pt-14 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-hair mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold">Order online</span>
          </div>

          <h1 className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tighter text-ink leading-[0.95]">
            {venueName}
          </h1>

          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="h-px w-10 bg-hair" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-ink-4 font-medium">Menu</span>
            <span className="h-px w-10 bg-hair" />
          </div>

          <p className="mt-4 text-xs text-ink-4">
            {totalAvailable} {totalAvailable === 1 ? 'item' : 'items'} available · tap to add
          </p>
        </div>
      </header>

      {/* ── Menu body ───────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-14 pb-32">
        {categories.length === 0 && (
          <p className="text-center text-ink-4 py-12 text-sm">
            The menu is being prepared. Please check back later.
          </p>
        )}

        {categories.map(cat => (
          <section key={cat.name}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-serif text-[18px] font-medium text-ink tracking-tight">{cat.name}</span>
              <div className="flex-1 h-px bg-hair" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-4 tabular">{cat.dishes.length}</span>
            </div>

            <div className="space-y-5">
              {cat.dishes.map(dish => {
                const qty = cart[dish.id] ?? 0
                return (
                  <article key={dish.id} className={`group ${dish.soldOut ? 'opacity-40' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className={`font-serif text-[16px] font-semibold text-ink leading-snug tracking-tight ${dish.soldOut ? 'line-through' : ''}`}>
                            {dish.name}
                          </h3>
                          {dish.soldOut && (
                            <span className="text-[10px] uppercase tracking-widest text-warn font-semibold shrink-0">Sold out</span>
                          )}
                        </div>
                        {dish.description && (
                          <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">{dish.description}</p>
                        )}
                        <span className={`mt-2 inline-block font-serif text-[15px] font-semibold text-ink tabular-nums ${dish.soldOut ? 'line-through' : ''}`}>
                          {peso(dish.price)}
                        </span>
                      </div>

                      {/* Add control / stepper — skip sold-out */}
                      {!dish.soldOut && (
                        <div className="shrink-0 pt-0.5">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => setQty(dish.id, 1)}
                              className="min-w-[64px] h-9 px-3 rounded-full border border-accent/40 text-accent text-xs font-semibold uppercase tracking-wider hover:bg-accent/10 transition-colors"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Remove one ${dish.name}`}
                                onClick={() => setQty(dish.id, qty - 1)}
                                className="w-9 h-9 rounded-full border border-hair flex items-center justify-center text-ink hover:border-accent hover:text-accent transition-colors text-lg leading-none"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-sm font-semibold tabular text-ink">{qty}</span>
                              <button
                                type="button"
                                aria-label={`Add one ${dish.name}`}
                                onClick={() => setQty(dish.id, qty + 1)}
                                className="w-9 h-9 rounded-full bg-accent text-canvas flex items-center justify-center hover:bg-accent-2 transition-colors text-lg leading-none"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-hair pb-24">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center space-y-3">
          <p className="text-[10px] text-ink-4 uppercase tracking-[0.25em]">
            Prices in Philippine Peso · Subject to change
          </p>
          <p className="text-[10px] text-ink-4">
            powered by{' '}
            <a href="https://sizzle-app-v1.vercel.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline underline-offset-2">
              Tenda Pro
            </a>
          </p>
        </div>
      </footer>

      {/* ── Sticky cart bar ─────────────────────────────────────────────────── */}
      {itemCount > 0 && !sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-canvas via-canvas to-transparent">
          <button
            type="button"
            onClick={openSheet}
            className="max-w-2xl mx-auto w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-accent text-canvas shadow-lg hover:bg-accent-2 transition-colors"
          >
            <span className="min-w-[26px] h-[26px] px-1.5 rounded-full bg-canvas/25 text-sm font-bold flex items-center justify-center tabular">
              {itemCount}
            </span>
            <span className="text-sm font-semibold uppercase tracking-wider">View cart</span>
            <span className="flex-1" />
            <span className="text-base font-bold tabular">{peso(total)}</span>
          </button>
        </div>
      )}

      {/* ── Checkout sheet ──────────────────────────────────────────────────── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSheet} />
          <div className="relative z-10 w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-surface border-t sm:border border-hair rounded-t-3xl sm:rounded-3xl shadow-2xl">
            {/* Sheet header */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-hair px-5 py-4 flex items-center gap-3">
              {(step === 'details' || step === 'pay') && (
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(step === 'pay' ? 'details' : 'review') }}
                  className="text-ink-4 hover:text-ink transition-colors -ml-1 p-1"
                  aria-label="Back"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <h2 className="font-serif text-lg font-semibold text-ink tracking-tight">
                {step === 'review' && 'Your order'}
                {step === 'details' && 'Your details'}
                {step === 'pay' && 'Pay via GCash'}
                {step === 'done' && 'Order received'}
              </h2>
              <span className="flex-1" />
              <button
                type="button"
                onClick={closeSheet}
                className="text-ink-4 hover:text-ink transition-colors p-1"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* ── Step: review ──────────────────────────────────────────── */}
              {step === 'review' && (
                <>
                  {cartLines.length === 0 ? (
                    <p className="text-center text-ink-4 text-sm py-8">Your cart is empty.</p>
                  ) : (
                    <div className="space-y-3">
                      {cartLines.map(({ dish, qty }) => (
                        <div key={dish.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{dish.name}</p>
                            <p className="text-xs text-ink-4 tabular">{peso(dish.price)} each</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              aria-label={`Remove one ${dish.name}`}
                              onClick={() => setQty(dish.id, qty - 1)}
                              className="w-8 h-8 rounded-full border border-hair flex items-center justify-center text-ink hover:border-accent hover:text-accent transition-colors text-base leading-none"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-semibold tabular">{qty}</span>
                            <button
                              type="button"
                              aria-label={`Add one ${dish.name}`}
                              onClick={() => setQty(dish.id, qty + 1)}
                              className="w-8 h-8 rounded-full bg-accent text-canvas flex items-center justify-center hover:bg-accent-2 transition-colors text-base leading-none"
                            >
                              +
                            </button>
                          </div>
                          <span className="w-16 text-right text-sm font-semibold tabular text-ink shrink-0">
                            {peso(dish.price * qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-hair pt-4">
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total</span>
                    <span className="font-serif text-xl font-semibold text-ink tabular">{peso(total)}</span>
                  </div>

                  {error && <p className="text-sm text-danger">{error}</p>}

                  <button
                    type="button"
                    onClick={goToDetails}
                    disabled={cartLines.length === 0}
                    className="w-full py-3 rounded-xl bg-accent text-canvas text-sm font-semibold uppercase tracking-wider hover:bg-accent-2 transition-colors disabled:opacity-40"
                  >
                    Continue
                  </button>
                </>
              )}

              {/* ── Step: details ─────────────────────────────────────────── */}
              {step === 'details' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Your name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                      placeholder="Juan dela Cruz"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Phone number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                      placeholder="09XX XXX XXXX"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Order type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['takeout', 'delivery'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setChannel(c)}
                          className={`py-2.5 rounded-lg text-sm font-medium capitalize transition-colors border ${
                            channel === c
                              ? 'bg-accent text-canvas border-accent'
                              : 'bg-canvas text-ink-3 border-hair hover:text-ink'
                          }`}
                        >
                          {c === 'takeout' ? 'Takeout' : 'Delivery'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                      Note <span className="text-ink-4 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                      placeholder="e.g. no onions, extra rice…"
                    />
                  </div>

                  {error && <p className="text-sm text-danger">{error}</p>}

                  <button
                    type="button"
                    onClick={goToPay}
                    className="w-full py-3 rounded-xl bg-accent text-canvas text-sm font-semibold uppercase tracking-wider hover:bg-accent-2 transition-colors"
                  >
                    Continue to payment
                  </button>
                </>
              )}

              {/* ── Step: pay ─────────────────────────────────────────────── */}
              {step === 'pay' && (
                <>
                  {paymentReady ? (
                    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-4 text-center">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-4 font-semibold">Send exactly</p>
                      <p className="font-serif text-3xl font-semibold text-accent tabular">{peso(total)}</p>
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between gap-3 text-left">
                          <span className="text-xs text-ink-4 uppercase tracking-wider">GCash number</span>
                          <span className="text-sm font-semibold text-ink tabular">{gcashNumber}</span>
                        </div>
                        {gcashName && gcashName.trim() && (
                          <div className="flex items-center justify-between gap-3 text-left">
                            <span className="text-xs text-ink-4 uppercase tracking-wider">Account name</span>
                            <span className="text-sm font-semibold text-ink">{gcashName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-warn/30 bg-warn/5 p-5 text-center">
                      <p className="text-sm text-warn leading-relaxed">
                        This venue hasn&apos;t set up GCash payment yet. Please contact them directly to order.
                      </p>
                    </div>
                  )}

                  {paymentReady && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">GCash reference number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={paymentRef}
                        onChange={e => setPaymentRef(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                        placeholder="e.g. 1234 567 890123"
                      />
                      <p className="text-[11px] text-ink-4 leading-relaxed">
                        Send the payment first, then enter the reference number from your GCash receipt.
                      </p>
                    </div>
                  )}

                  {error && <p className="text-sm text-danger">{error}</p>}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting || !paymentReady}
                    className="w-full py-3 rounded-xl bg-accent text-canvas text-sm font-semibold uppercase tracking-wider hover:bg-accent-2 transition-colors disabled:opacity-40"
                  >
                    {submitting ? 'Submitting…' : `Submit order · ${peso(total)}`}
                  </button>
                </>
              )}

              {/* ── Step: done ────────────────────────────────────────────── */}
              {step === 'done' && confirmation && (
                <div className="text-center space-y-5 py-4">
                  <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M5 13.5l5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-xl font-semibold text-ink">Order received!</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">
                      {venueName} will confirm your GCash payment shortly.
                    </p>
                  </div>
                  <div className="rounded-xl border border-hair bg-canvas/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-ink-4 uppercase tracking-wider">
                      {confirmation.itemCount} {confirmation.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-serif text-base font-semibold text-ink tabular">{peso(confirmation.total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="w-full py-3 rounded-xl border border-hair text-ink-3 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { logSale } from '../sales/actions'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { toggleSoldOut } from '../menu/dishActions'

const CHANNELS = [
  { value: 'dine_in',  label: 'Dine-in' },
  { value: 'takeout',  label: 'Takeout' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other',    label: 'Other' },
]

interface DishOption {
  id: string
  name: string
  category: string
  price: number
  foodCost: number
  soldOutDate: string | null
}

interface OrderItem {
  dishId: string
  dishName: string
  qty: number
  unitPrice: number
  unitCost: number
}

interface ReceiptData {
  receiptNumber: string
  soldAt: Date
  channel: string
  items: OrderItem[]
  subtotal: number
  discount: number
  serviceCharge: number
  total: number
  note: string
  tableNum: string
  customerName: string
  vatRegistered: boolean
}

function generateReceiptNum(): string {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).replace(/-/g, '')
  const r = String(Math.floor(Math.random() * 9000) + 1000)
  return `RCP-${d}-${r}`
}

export default function POSClient({
  dishes,
  venueName,
  vatRegistered,
}: {
  dishes: DishOption[]
  venueName: string
  vatRegistered: boolean
}) {
  const toast = useToast()
  const router = useRouter()

  const [channel, setChannel]   = useState('dine_in')
  const [dishSearch, setDishSearch] = useState('')
  const [note, setNote]         = useState('')
  const [order, setOrder]       = useState<OrderItem[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [receipt, setReceipt]   = useState<ReceiptData | null>(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  const [discountType, setDiscountType] = useState<'%' | '₱'>('%')
  const [discountVal, setDiscountVal]   = useState('')
  const [serviceChargeVal, setServiceChargeVal] = useState('')
  const [tableNum, setTableNum] = useState('')
  const [customerName, setCustomerName] = useState('')

  const ALL_CATEGORIES = '__all__'
  const categories  = [...new Set(dishes.map(d => d.category))].sort()
  const byCategory  = Object.fromEntries(
    categories.map(cat => [cat, dishes.filter(d => d.category === cat)])
  )
  // Default to All so owners see the whole menu without tab-hunting.
  const activeCat   = category || ALL_CATEGORIES
  const catDishes   = activeCat === ALL_CATEGORIES ? dishes : (byCategory[activeCat] ?? [])
  const todayManila = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const visibleDishes = dishSearch.trim()
    ? dishes.filter(d => d.name.toLowerCase().includes(dishSearch.toLowerCase()))
    : catDishes

  const subtotal      = order.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discount      = discountType === '%'
    ? Math.round(subtotal * (parseFloat(discountVal) || 0) / 100)
    : Math.round((parseFloat(discountVal) || 0) * 100)
  const serviceCharge = Math.round(subtotal * (parseFloat(serviceChargeVal) || 0) / 100)
  const total         = Math.max(0, subtotal - discount + serviceCharge)

  function addItem(dish: DishOption) {
    setOrder(prev => {
      const ex = prev.find(i => i.dishId === dish.id)
      if (ex) return prev.map(i => i.dishId === dish.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { dishId: dish.id, dishName: dish.name, qty: 1, unitPrice: dish.price, unitCost: dish.foodCost }]
    })
  }

  function changeQty(dishId: string, delta: number) {
    setOrder(prev =>
      prev.map(i => i.dishId === dishId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    )
  }

  function resetPOS() {
    setOrder([]); setChannel('dine_in'); setNote('')
    setError(''); setCategory(categories[0] ?? '')
    setDiscountType('%'); setDiscountVal('')
    setServiceChargeVal(''); setTableNum(''); setCustomerName('')
  }

  async function handleToggleSoldOut(dishId: string) {
    await toggleSoldOut(dishId)
    router.refresh()
  }

  async function handleCharge() {
    if (order.length === 0) { setError('Add at least one item.'); return }
    setLoading(true); setError('')
    const result = await logSale({
      channel: channel as 'dine_in' | 'takeout' | 'delivery' | 'other',
      total,
      note,
      items: order,
      customerName: customerName.trim() || undefined,
      // Dine-in & takeout flow through the kitchen; delivery/other skip it
      // because those usually arrive via aggregator apps that confirm prep
      // elsewhere. Owner can still bump them from the Sales page later.
      sendToKitchen: channel === 'dine_in' || channel === 'takeout',
    })
    if (result?.error) { setError(result.error); setLoading(false); return }
    const receiptData: ReceiptData = {
      receiptNumber: generateReceiptNum(),
      soldAt:        new Date(),
      channel,
      items:         [...order],
      subtotal,
      discount,
      serviceCharge,
      total,
      note,
      tableNum:      tableNum.trim(),
      customerName:  customerName.trim(),
      vatRegistered,
    }
    toast('Sale logged')
    setLoading(false)
    resetPOS()
    setReceipt(receiptData)
  }

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden !important; }
          #tenda-receipt-print,
          #tenda-receipt-print * { visibility: visible !important; }
          #tenda-receipt-print {
            position: fixed !important;
            inset: 0 !important;
            background: #fff !important;
            color: #000 !important;
            padding: 32px 28px !important;
            max-width: 400px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* ── Layout: Left menu + Right cart ────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">

        {/* Left: Menu */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-hair shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 3.5V3a3 3 0 016 0v.5M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-ink">POS</span>
            <span className="text-xs text-ink-4">·</span>
            <span className="text-sm text-ink-4 truncate">{venueName}</span>
            <div className="flex-1" />
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={dishSearch}
                onChange={e => setDishSearch(e.target.value)}
                placeholder="Search dishes…"
                className="pl-7 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hair text-xs text-ink placeholder:text-ink-4 w-36 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <span className="text-xs text-ink-4 tabular">
              {new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {/* Category tabs (with "All" first so the whole menu is one tap away) */}
          {categories.length > 1 && (
            <div className="flex gap-1.5 px-4 py-2.5 border-b border-hair overflow-x-auto shrink-0 scrollbar-none">
              <button
                key={ALL_CATEGORIES}
                onClick={() => { setCategory(ALL_CATEGORIES); setDishSearch('') }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCat === ALL_CATEGORIES
                    ? 'bg-accent text-canvas'
                    : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink'
                }`}
              >
                All <span className="opacity-60">· {dishes.length}</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setDishSearch('') }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCat === cat
                      ? 'bg-accent text-canvas'
                      : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Dish tiles */}
          <div className="flex-1 overflow-y-auto p-4">
            {dishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-ink-4">
                <p className="text-sm">No menu items yet</p>
                <a href="/menu" className="text-xs text-accent hover:underline">Add dishes in Menu</a>
              </div>
            ) : visibleDishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-ink-4">
                <p className="text-sm">No dishes match &ldquo;{dishSearch}&rdquo;</p>
              </div>
            ) : (() => {
              // When "All" is selected and the user isn't searching, group dishes
              // under category headers so the whole menu stays scannable.
              const isAllView = activeCat === ALL_CATEGORIES && !dishSearch.trim() && categories.length > 1
              const dishTile = (dish: DishOption) => {
                const inOrder   = order.find(i => i.dishId === dish.id)
                const isSoldOut = dish.soldOutDate === todayManila
                return (
                  <div
                    key={dish.id}
                    role="button"
                    tabIndex={isSoldOut ? -1 : 0}
                    onClick={() => { if (!isSoldOut) addItem(dish) }}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isSoldOut) { e.preventDefault(); addItem(dish) } }}
                    className={`relative group text-left p-4 rounded-xl border transition-all select-none ${
                      isSoldOut
                        ? 'border-hair bg-surface opacity-50'
                        : inOrder
                          ? 'border-accent bg-accent/8 shadow-sm cursor-pointer'
                          : 'border-hair bg-surface hover:border-hair-2 hover:bg-surface-2 cursor-pointer'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleToggleSoldOut(dish.id) }}
                      className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide leading-none transition-all ${
                        isSoldOut
                          ? 'bg-danger/20 text-danger border border-danger/20'
                          : 'opacity-0 group-hover:opacity-100 bg-surface-3 text-ink-4 hover:bg-danger/10 hover:text-danger'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : '×'}
                    </button>
                    {!isSoldOut && inOrder && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent text-canvas text-[10px] font-bold flex items-center justify-center leading-none">
                        {inOrder.qty}
                      </span>
                    )}
                    <p className="text-[13px] font-semibold text-ink leading-snug pr-6 line-clamp-2">{dish.name}</p>
                    <p className="text-sm font-bold text-accent mt-2 tabular">{formatCurrency(dish.price)}</p>
                  </div>
                )
              }
              if (!isAllView) {
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {visibleDishes.map(dishTile)}
                  </div>
                )
              }
              return (
                <div className="space-y-6">
                  {categories.map(cat => (
                    <section key={cat}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-1 h-5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                        <h3 className="text-lg font-extrabold text-ink uppercase tracking-wide leading-none">{cat}</h3>
                        <span className="h-px flex-1 bg-hair" />
                        <span className="text-xs font-bold tabular text-ink-3">{byCategory[cat].length}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {byCategory[cat].map(dishTile)}
                      </div>
                    </section>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Right: Cart — always visible md+, full-screen overlay on mobile */}
        <div className={`flex flex-col border-l border-hair bg-surface shrink-0 md:w-72 xl:w-80 ${mobileCartOpen ? 'fixed inset-0 z-50 bg-canvas w-full border-l-0' : 'hidden md:flex'}`}>

          <div className="px-4 py-3 border-b border-hair shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileCartOpen(false)}
                className="md:hidden p-1 -ml-1 text-ink-4 hover:text-ink transition-colors"
                aria-label="Back to menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Order</p>
            </div>
            {order.length > 0 && (
              <button
                onClick={() => setOrder([])}
                className="text-[11px] text-ink-4 hover:text-danger transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Order items */}
          <div className="flex-1 overflow-y-auto">
            {order.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-ink-4 gap-1.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" opacity="0.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs">Tap items to add</p>
              </div>
            ) : (
              <div className="divide-y divide-hair">
                {order.map(item => (
                  <div key={item.dishId} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink leading-snug truncate">{item.dishName}</p>
                      <p className="text-[11px] text-ink-4 tabular mt-0.5">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(item.dishId, -1)}
                        className="w-6 h-6 rounded-md bg-surface-2 hover:bg-danger/15 text-ink-2 hover:text-danger flex items-center justify-center text-sm font-medium transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular text-ink">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.dishId, 1)}
                        className="w-6 h-6 rounded-md bg-surface-2 hover:bg-accent/15 text-ink-2 hover:text-accent flex items-center justify-center text-sm font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[13px] font-semibold text-ink tabular w-16 text-right shrink-0">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart footer */}
          <div className="border-t border-hair p-4 space-y-3 shrink-0">

            {/* Channel */}
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold mb-1.5">Channel</p>
              <div className="flex gap-1 flex-wrap">
                {CHANNELS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setChannel(c.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      channel === c.value
                        ? 'bg-accent text-canvas'
                        : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer name — for "Order for Lina!" call-outs */}
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold mb-1.5">
                Customer name <span className="normal-case font-normal">(optional)</span>
              </p>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Lina, Juan, Ate Pen…"
                maxLength={48}
                autoComplete="off"
                className="w-full px-2.5 py-1.5 rounded-lg bg-canvas border border-hair text-[12px] text-ink placeholder:text-ink-4"
              />
            </div>

            {/* Table # + Note */}
            <div>
              {channel === 'dine_in' ? (
                <>
                  <div className="flex gap-2 mb-1.5">
                    <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold w-20 shrink-0">Table #</p>
                    <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold flex-1">
                      Note <span className="normal-case font-normal">(optional)</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tableNum}
                      onChange={e => setTableNum(e.target.value)}
                      placeholder="—"
                      className="w-20 shrink-0 px-2.5 py-1.5 rounded-lg bg-canvas border border-hair text-[12px] text-ink placeholder:text-ink-4 text-center"
                    />
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="special req…"
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-canvas border border-hair text-[12px] text-ink placeholder:text-ink-4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold mb-1.5">
                    Note <span className="normal-case font-normal">(optional)</span>
                  </p>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="special req…"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-canvas border border-hair text-[12px] text-ink placeholder:text-ink-4"
                  />
                </>
              )}
            </div>

            {/* Discount */}
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold mb-1.5">Discount</p>
              <div className="flex items-center gap-1.5">
                <div className="flex rounded-lg overflow-hidden border border-hair shrink-0">
                  <button
                    onClick={() => { setDiscountType('%'); setDiscountVal('') }}
                    className={`px-2.5 py-1 text-xs font-semibold transition-colors ${discountType === '%' ? 'bg-accent text-canvas' : 'bg-surface-2 text-ink-3 hover:text-ink'}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => { setDiscountType('₱'); setDiscountVal('') }}
                    className={`px-2.5 py-1 text-xs font-semibold transition-colors ${discountType === '₱' ? 'bg-accent text-canvas' : 'bg-surface-2 text-ink-3 hover:text-ink'}`}
                  >
                    ₱
                  </button>
                </div>
                {discountType === '%' && (
                  <>
                    <button onClick={() => setDiscountVal('10')} className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${discountVal === '10' ? 'border-accent bg-accent/10 text-accent' : 'border-hair bg-surface-2 text-ink-3 hover:text-ink'}`}>10%</button>
                    <button onClick={() => setDiscountVal('20')} className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${discountVal === '20' ? 'border-accent bg-accent/10 text-accent' : 'border-hair bg-surface-2 text-ink-3 hover:text-ink'}`}>20%</button>
                  </>
                )}
                <input
                  type="number"
                  min="0"
                  step={discountType === '%' ? '1' : '0.01'}
                  value={discountVal}
                  onChange={e => setDiscountVal(e.target.value)}
                  placeholder={discountType === '%' ? '0' : '0.00'}
                  className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-canvas border border-hair text-xs text-ink tabular placeholder:text-ink-4"
                />
              </div>
              {discount > 0 && (
                <p className="text-[11px] text-danger mt-1 text-right tabular">
                  −{formatCurrency(discount)} discount
                </p>
              )}
            </div>

            {/* Service Charge */}
            <div>
              <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold mb-1.5">Service Charge</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setServiceChargeVal('10')} className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${serviceChargeVal === '10' ? 'border-accent bg-accent/10 text-accent' : 'border-hair bg-surface-2 text-ink-3 hover:text-ink'}`}>10%</button>
                <button onClick={() => setServiceChargeVal('12')} className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${serviceChargeVal === '12' ? 'border-accent bg-accent/10 text-accent' : 'border-hair bg-surface-2 text-ink-3 hover:text-ink'}`}>12%</button>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={serviceChargeVal}
                  onChange={e => setServiceChargeVal(e.target.value)}
                  placeholder="0"
                  className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-canvas border border-hair text-xs text-ink tabular placeholder:text-ink-4"
                />
                <span className="text-xs text-ink-4 shrink-0">%</span>
              </div>
              {serviceCharge > 0 && (
                <p className="text-[11px] text-accent mt-1 text-right tabular">
                  +{formatCurrency(serviceCharge)} service charge
                </p>
              )}
            </div>

            {/* Total row */}
            <div className="flex items-baseline justify-between pt-1 border-t border-hair">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold tabular text-accent">{formatCurrency(total)}</span>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              onClick={handleCharge}
              disabled={loading || order.length === 0}
              className="w-full py-3 rounded-xl btn-primary font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing…'
              ) : (
                <>
                  Charge{total > 0 ? ` ${formatCurrency(total)}` : ''}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile floating "View Order" bar ─────────────────────────────────── */}
      {order.length > 0 && !mobileCartOpen && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-canvas/90 backdrop-blur-xl border-t border-hair">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-between px-5"
          >
            <span className="tabular">{order.reduce((s, i) => s + i.qty, 0)} item{order.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</span>
            <span>View Order</span>
            <span className="tabular">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* ── Receipt Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title="Receipt"
        icon={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 1h10v12l-1.5-1.5L9 13l-1.5-1.5L6 13l-1.5-1.5L3 13l-1.5-1.5L0 13V1h2zm0 0" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        }
      >
        {receipt && (
          <>
            {/* Receipt — white card, solid black text, clean paper style */}
            <div
              id="tenda-receipt-print"
              className="rounded-xl overflow-hidden"
              style={{ background: '#fff', color: '#111', fontFamily: 'inherit' }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 text-center" style={{ borderBottom: '1px dashed #d1d5db' }}>
                <p className="text-lg font-bold tracking-tight" style={{ color: '#111' }}>{venueName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mt-0.5" style={{ color: '#6b7280' }}>Official Receipt</p>
              </div>

              {/* Order-for chip */}
              {receipt.customerName && (
                <div className="mx-5 mt-4 rounded-lg px-3 py-2 text-center" style={{ background: '#f3f4f6' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#9ca3af' }}>Order for</p>
                  <p className="text-xl font-extrabold leading-tight mt-0.5" style={{ color: '#111' }}>{receipt.customerName}</p>
                </div>
              )}

              {/* Meta row */}
              <div className="px-5 pt-4 pb-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold" style={{ color: '#374151' }}>{receipt.receiptNumber}</span>
                  <span className="tabular" style={{ color: '#6b7280' }}>
                    {receipt.soldAt.toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                      year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span style={{ color: '#9ca3af' }}>Channel:</span>
                  <span className="font-semibold" style={{ color: '#374151' }}>
                    {CHANNELS.find(c => c.value === receipt.channel)?.label}
                  </span>
                  {receipt.tableNum && (
                    <span className="font-semibold" style={{ color: '#374151' }}>· Table {receipt.tableNum}</span>
                  )}
                  {receipt.note && <span style={{ color: '#9ca3af' }}>· {receipt.note}</span>}
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px dashed #d1d5db' }}>
                {receipt.items.map(item => (
                  <div key={item.dishId} className="flex items-start gap-2 text-sm">
                    <span className="flex-1 leading-snug" style={{ color: '#111' }}>{item.dishName}</span>
                    <span className="tabular shrink-0 text-xs mt-0.5" style={{ color: '#9ca3af' }}>×{item.qty}</span>
                    <span className="tabular font-semibold w-20 text-right shrink-0" style={{ color: '#111' }}>
                      {formatCurrency(item.qty * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              {receipt.vatRegistered ? (
                <div className="px-5 py-3 space-y-1.5" style={{ borderTop: '1px dashed #d1d5db' }}>
                  {(receipt.discount > 0 || receipt.serviceCharge > 0) && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span style={{ color: '#6b7280' }}>Subtotal</span>
                      <span className="tabular" style={{ color: '#374151' }}>{formatCurrency(receipt.subtotal)}</span>
                    </div>
                  )}
                  {receipt.discount > 0 && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span style={{ color: '#dc2626' }}>Discount</span>
                      <span className="tabular" style={{ color: '#dc2626' }}>−{formatCurrency(receipt.discount)}</span>
                    </div>
                  )}
                  {receipt.serviceCharge > 0 && (
                    <div className="flex items-baseline justify-between text-sm">
                      <span style={{ color: '#374151' }}>Service Charge</span>
                      <span className="tabular" style={{ color: '#374151' }}>+{formatCurrency(receipt.serviceCharge)}</span>
                    </div>
                  )}
                  {(() => {
                    const vatNet = Math.round(receipt.total / 1.12)
                    const vatAmt = receipt.total - vatNet
                    return (
                      <>
                        <div className="flex items-baseline justify-between text-xs" style={{ color: '#9ca3af' }}>
                          <span>Net Amount (excl. VAT)</span>
                          <span className="tabular">{formatCurrency(vatNet)}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs" style={{ color: '#9ca3af' }}>
                          <span>VAT (12%)</span>
                          <span className="tabular">{formatCurrency(vatAmt)}</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 mt-1" style={{ borderTop: '2px solid #111' }}>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#111' }}>Total (VAT incl.)</span>
                          <span className="text-2xl font-black tabular" style={{ color: '#111' }}>{formatCurrency(receipt.total)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="px-5 py-3 space-y-1.5" style={{ borderTop: '1px dashed #d1d5db' }}>
                  {(receipt.discount > 0 || receipt.serviceCharge > 0) && (
                    <>
                      <div className="flex items-baseline justify-between text-sm">
                        <span style={{ color: '#6b7280' }}>Subtotal</span>
                        <span className="tabular" style={{ color: '#374151' }}>{formatCurrency(receipt.subtotal)}</span>
                      </div>
                      {receipt.discount > 0 && (
                        <div className="flex items-baseline justify-between text-sm">
                          <span style={{ color: '#dc2626' }}>Discount</span>
                          <span className="tabular" style={{ color: '#dc2626' }}>−{formatCurrency(receipt.discount)}</span>
                        </div>
                      )}
                      {receipt.serviceCharge > 0 && (
                        <div className="flex items-baseline justify-between text-sm">
                          <span style={{ color: '#374151' }}>Service Charge</span>
                          <span className="tabular" style={{ color: '#374151' }}>+{formatCurrency(receipt.serviceCharge)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-baseline justify-between pt-2 mt-1" style={{ borderTop: '2px solid #111' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#111' }}>Total</span>
                    <span className="text-2xl font-black tabular" style={{ color: '#111' }}>{formatCurrency(receipt.total)}</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-5 pb-5 pt-3 text-center" style={{ borderTop: '1px dashed #d1d5db' }}>
                <p className="text-[10px] font-semibold" style={{ color: '#9ca3af' }}>Thank you for your order!</p>
                {receipt.vatRegistered && (
                  <p className="text-[9px] mt-0.5" style={{ color: '#d1d5db' }}>VAT Registered · Prices are VAT-inclusive</p>
                )}
              </div>
            </div>

            {/* Kitchen margin summary — owner-facing, hidden from print */}
            {(() => {
              const foodCost   = receipt.items.reduce((s, i) => s + i.qty * i.unitCost, 0)
              const grossProfit = receipt.total - foodCost
              const marginPct   = receipt.total > 0 ? (grossProfit / receipt.total) * 100 : null
              if (foodCost === 0) return null
              return (
                <div className="print:hidden mt-3 rounded-lg bg-surface-2 border border-hair px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest">Kitchen summary</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-3">Food cost</span>
                    <span className="tabular text-warn font-medium">{formatCurrency(foodCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-3">Gross profit</span>
                    <span className={`tabular font-semibold ${grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(grossProfit)}
                      {marginPct !== null && (
                        <span className="ml-1.5 font-normal text-ink-4">({marginPct.toFixed(0)}%)</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-2 pt-4 mt-1">
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-2 btn-secondary rounded-lg text-sm"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 btn-primary rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 5V2h7v3M3.5 10.5H2A.5.5 0 011.5 10V5.5A.5.5 0 012 5h10a.5.5 0 01.5.5V10a.5.5 0 01-.5.5h-1.5M3.5 8.5h7V12h-7V8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Print
              </button>
            </div>
            <button
              onClick={() => setReceipt(null)}
              className="w-full mt-2 py-1.5 text-xs text-ink-4 hover:text-accent transition-colors text-center"
            >
              New order →
            </button>
          </>
        )}
      </Modal>
    </>
  )
}

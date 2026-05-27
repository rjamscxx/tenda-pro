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

const CHANNEL_BADGE: Record<string, string> = {
  dine_in:  'bg-accent/15 text-accent',
  takeout:  'bg-sky-400/15 text-sky-400',
  delivery: 'bg-warn/15 text-warn',
  other:    'bg-surface-3 text-ink-3',
}

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

  const [discountType, setDiscountType] = useState<'%' | '₱'>('%')
  const [discountVal, setDiscountVal]   = useState('')
  const [serviceChargeVal, setServiceChargeVal] = useState('')
  const [tableNum, setTableNum] = useState('')

  const categories  = [...new Set(dishes.map(d => d.category))].sort()
  const byCategory  = Object.fromEntries(
    categories.map(cat => [cat, dishes.filter(d => d.category === cat)])
  )
  const activeCat   = category || categories[0] || ''
  const catDishes   = byCategory[activeCat] ?? []
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
    setServiceChargeVal(''); setTableNum('')
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
          #sizzle-receipt-print,
          #sizzle-receipt-print * { visibility: visible !important; }
          #sizzle-receipt-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: #fff !important;
            color: #000 !important;
            padding: 28px !important;
            max-width: 380px !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* ── Layout: Left menu + Right cart ────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">

        {/* Left: Menu */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-hair shrink-0">
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

          {/* Category tabs */}
          {categories.length > 1 && (
            <div className="flex gap-1.5 px-4 py-2.5 border-b border-hair overflow-x-auto shrink-0 scrollbar-none">
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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleDishes.map(dish => {
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-72 xl:w-80 flex flex-col border-l border-hair bg-surface shrink-0">

          <div className="px-4 py-3 border-b border-hair shrink-0 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Order</p>
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
            <div id="sizzle-receipt-print" className="space-y-3">

              <div className="text-center pb-3 border-b border-hair">
                <p className="text-base font-bold text-ink">{venueName}</p>
                <p className="text-[11px] text-ink-4 mt-0.5 uppercase tracking-wider">Official Receipt</p>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-3">
                <span className="font-mono font-semibold text-ink-2">{receipt.receiptNumber}</span>
                <span className="tabular">
                  {receipt.soldAt.toLocaleString('en-PH', {
                    timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                    year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-ink-3">Channel:</span>
                <span className={`px-2 py-0.5 rounded-md font-medium ${CHANNEL_BADGE[receipt.channel] ?? 'bg-surface-3 text-ink-3'}`}>
                  {CHANNELS.find(c => c.value === receipt.channel)?.label}
                </span>
                {receipt.tableNum && (
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-surface-2 text-ink-2">
                    Table: {receipt.tableNum}
                  </span>
                )}
                {receipt.note && <span className="text-ink-4">· {receipt.note}</span>}
              </div>

              <div className="border-t border-dashed border-hair pt-3 space-y-2">
                {receipt.items.map(item => (
                  <div key={item.dishId} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-ink truncate">{item.dishName}</span>
                    <span className="text-ink-4 tabular shrink-0">×{item.qty}</span>
                    <span className="text-ink tabular font-medium w-20 text-right shrink-0">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {receipt.vatRegistered ? (
                <div className="border-t border-hair pt-3 space-y-1.5">
                  {(receipt.discount > 0 || receipt.serviceCharge > 0) && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-ink-4">Subtotal</span>
                      <span className="text-sm tabular text-ink-3">{formatCurrency(receipt.subtotal)}</span>
                    </div>
                  )}
                  {receipt.discount > 0 && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-danger">Discount</span>
                      <span className="text-sm tabular text-danger">−{formatCurrency(receipt.discount)}</span>
                    </div>
                  )}
                  {receipt.serviceCharge > 0 && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-accent">Service Charge</span>
                      <span className="text-sm tabular text-accent">+{formatCurrency(receipt.serviceCharge)}</span>
                    </div>
                  )}
                  {(() => {
                    const vatNet = Math.round(receipt.total / 1.12)
                    const vatAmt = receipt.total - vatNet
                    return (
                      <>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-ink-4">Net Amount (excl. VAT)</span>
                          <span className="text-sm tabular text-ink-3">{formatCurrency(vatNet)}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-ink-4">VAT (12%)</span>
                          <span className="text-sm tabular text-ink-3">{formatCurrency(vatAmt)}</span>
                        </div>
                        <div className="border-t border-dashed border-hair pt-1.5 flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total (VAT incl.)</span>
                          <span className="text-2xl font-bold tabular text-accent">{formatCurrency(receipt.total)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="border-t border-hair pt-3 space-y-1.5">
                  {(receipt.discount > 0 || receipt.serviceCharge > 0) && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-ink-4">Subtotal</span>
                        <span className="text-sm tabular text-ink-3">{formatCurrency(receipt.subtotal)}</span>
                      </div>
                      {receipt.discount > 0 && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-danger">Discount</span>
                          <span className="text-sm tabular text-danger">−{formatCurrency(receipt.discount)}</span>
                        </div>
                      )}
                      {receipt.serviceCharge > 0 && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-accent">Service Charge</span>
                          <span className="text-sm tabular text-accent">+{formatCurrency(receipt.serviceCharge)}</span>
                        </div>
                      )}
                      <div className="border-t border-dashed border-hair pt-1.5" />
                    </>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-bold tabular text-accent">{formatCurrency(receipt.total)}</span>
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] text-ink-4 pt-1 border-t border-dashed border-hair">
                Thank you for your order!
              </p>
              {receipt.vatRegistered && (
                <p className="text-center text-[9px] text-ink-4">VAT Reg. · Prices VAT-inclusive</p>
              )}
            </div>

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

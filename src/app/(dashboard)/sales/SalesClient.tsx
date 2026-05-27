'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { logSale, deleteSale, getSaleItems } from './actions'
import { formatCurrency, parseCents } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

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

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: '7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all',   label: 'All time' },
] as const

type Period = typeof PERIODS[number]['value']

interface Sale {
  id: string
  channel: string
  total: number
  note: string | null
  soldAt: Date | string
  itemCount: number
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

interface SaleItemRow {
  id: string
  dishName: string | null
  qty: number
  unitPrice: number
  unitCost: number
}

function manilaDateOf(dt: Date | string) {
  return new Date(dt).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

function filterByPeriod(rows: Sale[], period: Period): Sale[] {
  if (period === 'all') return rows
  const today      = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const weekStart  = new Date(Date.now() - 6 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const monthStart = today.slice(0, 7) + '-01'
  return rows.filter(s => {
    const d = manilaDateOf(s.soldAt)
    if (period === 'today') return d === today
    if (period === 'week')  return d >= weekStart
    if (period === 'month') return d >= monthStart
    return true
  })
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function SalesClient({
  sales,
  dishes,
}: {
  sales: Sale[]
  dishes: DishOption[]
}) {
  const toast = useToast()
  const searchParams = useSearchParams()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('log') === '1') setOpen(true)
    try {
      const saved = localStorage.getItem('sizzle-sales-period') as Period | null
      if (saved && PERIODS.some(p => p.value === saved)) setPeriod(saved)
    } catch {}
  }, [searchParams])

  const [error, setError]             = useState('')
  const [mode, setMode]               = useState<'items' | 'manual'>('items')
  const [channel, setChannel]         = useState('dine_in')
  const [note, setNote]               = useState('')
  const [manualTotal, setManualTotal] = useState('')
  const [order, setOrder]             = useState<OrderItem[]>([])
  const [period, setPeriod]           = useState<Period>('all')
  const [chanFilter, setChanFilter]   = useState<string>('all')

  const [detailSale, setDetailSale]       = useState<Sale | null>(null)
  const [detailItems, setDetailItems]     = useState<SaleItemRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const orderTotal = order.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const categories = [...new Set(dishes.map(d => d.category))].sort()
  const byCategory = Object.fromEntries(
    categories.map(cat => [cat, dishes.filter(d => d.category === cat)])
  )

  function addItem(dish: DishOption) {
    setOrder(prev => {
      const existing = prev.find(i => i.dishId === dish.id)
      if (existing) return prev.map(i => i.dishId === dish.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { dishId: dish.id, dishName: dish.name, qty: 1, unitPrice: dish.price, unitCost: dish.foodCost }]
    })
  }

  function changeQty(dishId: string, delta: number) {
    setOrder(prev =>
      prev.map(i => i.dishId === dishId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    )
  }

  function resetModal() {
    setMode('items'); setChannel('dine_in'); setNote('')
    setManualTotal(''); setOrder([]); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const total = mode === 'items' ? orderTotal : parseCents(manualTotal)
    if (!total || total <= 0) { setError('Add items or enter a valid total.'); return }
    setLoading(true); setError('')
    const result = await logSale({
      channel: channel as 'dine_in' | 'takeout' | 'delivery' | 'other',
      total,
      note,
      items: mode === 'items' ? order : [],
    })
    if (result?.error) { setError(result.error); setLoading(false); return }
    setOpen(false); resetModal(); setLoading(false)
    toast('Sale logged')
  }

  async function openDetail(sale: Sale) {
    setDetailSale(sale)
    setDetailItems([])
    setDetailLoading(true)
    const rows = await getSaleItems(sale.id)
    setDetailItems(rows as SaleItemRow[])
    setDetailLoading(false)
  }

  function exportCSV(rows: Sale[]) {
    const header = 'Date,Time,Channel,Total,Items,Note'
    const lines  = rows.map(s => {
      const dt   = new Date(s.soldAt)
      const date = dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      const time = dt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })
      return [
        date, time,
        CHANNELS.find(c => c.value === s.channel)?.label ?? s.channel,
        (s.total / 100).toFixed(2),
        s.itemCount,
        s.note ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    downloadCSV('sales.csv', [header, ...lines].join('\r\n'))
  }

  const byPeriod    = filterByPeriod(sales, period)
  const displayed   = chanFilter === 'all' ? byPeriod : byPeriod.filter(s => s.channel === chanFilter)
  const periodTotal = displayed.reduce((s, r) => s + r.total, 0)
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? 'All time'

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-hair shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Sales</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            <span className="tabular">{displayed.length}</span> entries
            <span className="mx-1.5 text-hair-2">·</span>
            {periodLabel}: <span className="tabular text-accent font-medium">{formatCurrency(periodTotal)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(displayed)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 9v2.5h9V9M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CSV
          </button>
          <button onClick={() => { resetModal(); setOpen(true) }} className="px-4 py-2 btn-primary rounded-lg">
            + Log sale
          </button>
        </div>
      </div>

      {/* ── Period + Channel filter ──────────────────────────────────────────── */}
      <div className="px-6 py-2.5 border-b border-hair flex items-center gap-1.5 flex-wrap shrink-0">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); try { localStorage.setItem('sizzle-sales-period', p.value) } catch {} }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p.value
                ? 'bg-accent text-canvas'
                : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="w-px h-4 bg-hair mx-0.5 shrink-0" />
        <button
          onClick={() => setChanFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            chanFilter === 'all'
              ? 'bg-accent text-canvas'
              : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2'
          }`}
        >
          All
        </button>
        {CHANNELS.map(c => (
          <button
            key={c.value}
            onClick={() => setChanFilter(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              chanFilter === c.value
                ? 'bg-accent text-canvas'
                : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Sales list ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-ink-4">
                <path d="M3 16L8 10l4 4 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-2">No sales {period !== 'all' ? 'in this period' : 'yet'}</p>
              {period !== 'all' ? (
                <p className="text-xs text-ink-4 mt-0.5">Try a wider date range</p>
              ) : (
                <div className="flex items-center gap-2 mt-3 justify-center">
                  <a href="/pos" className="px-3 py-1.5 rounded-lg bg-surface-2 border border-hair text-xs text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors">Go to POS</a>
                  <button onClick={() => { resetModal(); setOpen(true) }} className="px-3 py-1.5 rounded-lg btn-primary text-xs">Log a sale</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas/90 backdrop-blur-sm z-10">
              <tr className="border-b border-hair">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Total</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Note / Items</th>
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {displayed.map(sale => (
                <tr key={sale.id} onClick={() => openDetail(sale)} className="group hover:bg-surface-2 transition-colors border-l-2 border-l-transparent hover:border-l-accent cursor-pointer">
                  <td className="px-6 py-3.5 text-ink-3 tabular whitespace-nowrap text-sm">
                    {new Date(sale.soldAt).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${CHANNEL_BADGE[sale.channel] ?? 'bg-surface-3 text-ink-3'}`}>
                      {CHANNELS.find(c => c.value === sale.channel)?.label ?? sale.channel}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right tabular font-semibold text-accent">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-3.5 text-ink-3 max-w-xs truncate text-sm">
                    {sale.itemCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                          {sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}
                        </span>
                        {sale.note && <span className="text-ink-4">· {sale.note}</span>}
                      </span>
                    ) : (
                      sale.note ?? <span className="text-ink-4">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sale.id) }}
                      className={`transition-all p-1 rounded text-xs font-semibold ${
                        pendingDelete === sale.id
                          ? 'opacity-100 text-danger'
                          : 'opacity-0 group-hover:opacity-100 text-ink-4 hover:text-danger'
                      }`}
                    >
                      {pendingDelete === sale.id ? 'Confirm?' : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 7.2A1 1 0 004.7 12h4.6a1 1 0 001-.9L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-hair bg-surface-2/50">
                <td className="px-6 py-3 text-xs text-ink-4 font-medium" colSpan={2}>
                  {periodLabel} ({displayed.length} {displayed.length === 1 ? 'entry' : 'entries'})
                </td>
                <td className="px-6 py-3 text-right tabular font-semibold text-ink">{formatCurrency(periodTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── Log Sale Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); resetModal() }}
        title="Log sale"
        icon={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 4V3a3 3 0 016 0v1M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex rounded-lg overflow-hidden border border-hair bg-surface-2 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => { setMode('items'); setError('') }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'items' ? 'bg-surface text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              Add items
            </button>
            <button
              type="button"
              onClick={() => { setMode('manual'); setError('') }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'manual' ? 'bg-surface text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              Enter total
            </button>
          </div>

          {mode === 'items' ? (
            <>
              {dishes.length === 0 ? (
                <div className="text-center py-6 text-sm text-ink-4">
                  No menu items yet —{' '}
                  <a href="/menu" className="text-accent hover:underline">add dishes in Menu</a>
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto -mx-1 px-1 space-y-3">
                  {categories.map(cat => (
                    <div key={cat}>
                      {categories.length > 1 && (
                        <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest mb-1 px-1">{cat}</p>
                      )}
                      <div className="space-y-0.5">
                        {byCategory[cat].map(dish => {
                          const inOrder = order.find(i => i.dishId === dish.id)
                          return (
                            <div key={dish.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors">
                              <span className="flex-1 text-sm text-ink truncate">{dish.name}</span>
                              <span className="text-xs tabular text-ink-3">{formatCurrency(dish.price)}</span>
                              {inOrder ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button type="button" onClick={() => changeQty(dish.id, -1)}
                                    className="w-6 h-6 rounded flex items-center justify-center bg-surface-3 hover:bg-danger/20 text-ink hover:text-danger text-sm transition-colors">
                                    −
                                  </button>
                                  <span className="w-5 text-center text-sm font-medium tabular text-ink">{inOrder.qty}</span>
                                  <button type="button" onClick={() => changeQty(dish.id, 1)}
                                    className="w-6 h-6 rounded flex items-center justify-center bg-surface-3 hover:bg-accent/20 text-ink hover:text-accent text-sm transition-colors">
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => addItem(dish)}
                                  className="shrink-0 w-6 h-6 rounded flex items-center justify-center bg-accent/10 text-accent hover:bg-accent/20 text-sm font-bold transition-colors">
                                  +
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.length > 0 && (
                <div className="rounded-lg border border-hair overflow-hidden">
                  {order.map(item => (
                    <div key={item.dishId} className="flex items-center gap-3 px-3 py-2 border-b border-hair last:border-0">
                      <span className="flex-1 text-sm text-ink truncate">{item.dishName}</span>
                      <span className="text-xs text-ink-4 tabular">×{item.qty}</span>
                      <span className="text-sm tabular font-medium text-accent">{formatCurrency(item.qty * item.unitPrice)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-surface-2">
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total</span>
                    <span className="tabular font-bold text-accent text-base">{formatCurrency(orderTotal)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Total (₱)</label>
              <input
                type="number" min="0" step="0.01" required={mode === 'manual'}
                value={manualTotal} onChange={e => setManualTotal(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Channel</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm">
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Note <span className="text-ink-4 normal-case font-normal">(opt)</span>
              </label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                placeholder="special order…" />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading || (mode === 'items' && order.length === 0 && dishes.length > 0)}
            className="w-full py-2.5 btn-primary rounded-lg"
          >
            {loading ? 'Saving…' : `Save sale${mode === 'items' && orderTotal > 0 ? ` · ${formatCurrency(orderTotal)}` : ''}`}
          </button>
        </form>
      </Modal>

      {/* ── Sale Detail Modal ────────────────────────────────────────────────── */}
      <Modal
        open={!!detailSale}
        onClose={() => setDetailSale(null)}
        title="Sale Detail"
      >
        {detailSale && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-ink-3 tabular">
                {new Date(detailSale.soldAt).toLocaleString('en-PH', {
                  timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                  year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${CHANNEL_BADGE[detailSale.channel] ?? 'bg-surface-3 text-ink-3'}`}>
                {CHANNELS.find(c => c.value === detailSale.channel)?.label ?? detailSale.channel}
              </span>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-sm text-ink-4">Loading items…</div>
            ) : detailItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink-4 border border-hair rounded-lg">
                No item breakdown for this sale.
              </div>
            ) : (
              <div className="border border-hair rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Item</th>
                      <th className="px-3 py-2 text-center text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Price</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hair">
                    {detailItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 text-ink">{item.dishName ?? <span className="text-ink-4 italic">deleted item</span>}</td>
                        <td className="px-3 py-2.5 text-center tabular text-ink-3">{item.qty}</td>
                        <td className="px-3 py-2.5 text-right tabular text-ink-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right tabular font-medium text-ink">{formatCurrency(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-2 border-t border-hair">
                      <td className="px-3 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wider" colSpan={3}>Total</td>
                      <td className="px-3 py-2 text-right tabular font-bold text-accent">{formatCurrency(detailSale.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {detailSale.note && (
              <p className="text-xs text-ink-4 border-t border-hair pt-2">Note: {detailSale.note}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  )

  async function handleDelete(id: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id)
      setTimeout(() => setPendingDelete(prev => prev === id ? null : prev), 3000)
      return
    }
    setPendingDelete(null)
    await deleteSale(id)
    toast('Sale deleted', 'info')
  }
}

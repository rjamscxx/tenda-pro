'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { logSale, deleteSale, toggleSalePaid, settleAllUnpaid } from './actions'
import { formatCurrency, parseCents } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

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

type Period     = typeof PERIODS[number]['value']
type PaidFilter = 'all' | 'paid' | 'unpaid'

interface SaleItem {
  id:        string
  dishName:  string | null
  qty:       number
  unitPrice: number
  unitCost:  number
}

interface Sale {
  id:           string
  channel:      string
  total:        number
  note:         string | null
  customerName: string | null
  soldAt:       Date | string
  isPaid:       boolean
  items:        SaleItem[]
}

interface DishOption {
  id:           string
  name:         string
  category:     string
  price:        number
  foodCost:     number
  soldOutDate:  string | null
}

interface OrderItem {
  dishId:    string
  dishName:  string
  qty:       number
  unitPrice: number
  unitCost:  number
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
  const [open, setOpen]       = useState(() => searchParams.get('log') === '1')
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [, startTransition]   = useTransition()

  const [error, setError]             = useState('')
  const [mode, setMode]               = useState<'items' | 'manual'>('items')
  const [channel, setChannel]         = useState('dine_in')
  const [note, setNote]               = useState('')
  const [manualTotal, setManualTotal] = useState('')
  const [order, setOrder]             = useState<OrderItem[]>([])
  const [newSaleUnpaid, setNewSaleUnpaid] = useState(false)
  const [period, setPeriod]           = useState<Period>(() => {
    if (typeof window === 'undefined') return 'all'
    try {
      const saved = localStorage.getItem('sizzle-sales-period') as Period | null
      if (saved && PERIODS.some(p => p.value === saved)) return saved
    } catch {}
    return 'all'
  })
  const [chanFilter, setChanFilter] = useState<string>('all')
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('all')

  // Optimistic paid toggles: { saleId → true|false } overrides server state
  // until the server action finishes + revalidation drops the override.
  const [paidOverride, setPaidOverride] = useState<Record<string, boolean>>({})

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
    setManualTotal(''); setOrder([]); setError(''); setNewSaleUnpaid(false)
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
      isPaid: !newSaleUnpaid,
    })
    if (result?.error) { setError(result.error); setLoading(false); return }
    setOpen(false); resetModal(); setLoading(false)
    toast(newSaleUnpaid ? 'Sale logged · marked unpaid' : 'Sale logged')
  }

  function handleSettleAll() {
    const unpaidIds = byPeriod.filter(s => !(paidOverride[s.id] ?? s.isPaid)).map(s => s.id)
    if (!unpaidIds.length) return
    if (!confirm(`Mark ${unpaidIds.length} unpaid sale${unpaidIds.length === 1 ? '' : 's'} as paid (${formatCurrency(unpaidTotal)})?`)) return
    // Optimistic: flip every unpaid override to true
    setPaidOverride(prev => {
      const next = { ...prev }
      for (const id of unpaidIds) next[id] = true
      return next
    })
    startTransition(() => {
      settleAllUnpaid().then(({ settled }) => {
        toast(`Settled ${settled} sale${settled === 1 ? '' : 's'}`)
      }).catch(() => {
        // Roll back overrides
        setPaidOverride(prev => {
          const next = { ...prev }
          for (const id of unpaidIds) delete next[id]
          return next
        })
        toast('Settle all failed', 'error')
      })
    })
  }

  function handleTogglePaid(saleId: string, currentPaid: boolean) {
    const nextPaid = !currentPaid
    setPaidOverride(prev => ({ ...prev, [saleId]: nextPaid }))
    startTransition(() => {
      toggleSalePaid(saleId).then(() => {
        toast(nextPaid ? 'Marked paid' : 'Marked unpaid', 'info')
      }).catch(() => {
        setPaidOverride(prev => {
          const { [saleId]: _, ...rest } = prev
          return rest
        })
        toast('Failed to update', 'error')
      })
    })
  }

  function exportCSV(rows: Sale[]) {
    const header = 'Date,Time,Channel,Total,Items,Paid,Note'
    const lines  = rows.map(s => {
      const dt   = new Date(s.soldAt)
      const date = dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      const time = dt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })
      const paid = (paidOverride[s.id] ?? s.isPaid) ? 'Yes' : 'No'
      return [
        date, time,
        CHANNELS.find(c => c.value === s.channel)?.label ?? s.channel,
        (s.total / 100).toFixed(2),
        s.items.length,
        paid,
        s.note ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    downloadCSV('sales.csv', [header, ...lines].join('\r\n'))
  }

  const byPeriod  = filterByPeriod(sales, period)
  const byChan    = chanFilter === 'all' ? byPeriod : byPeriod.filter(s => s.channel === chanFilter)
  const displayed = paidFilter === 'all'
    ? byChan
    : byChan.filter(s => {
        const paid = paidOverride[s.id] ?? s.isPaid
        return paidFilter === 'paid' ? paid : !paid
      })
  const periodTotal = displayed.reduce((s, r) => s + r.total, 0)
  const unpaidTotal = byPeriod.reduce((s, r) => {
    const paid = paidOverride[r.id] ?? r.isPaid
    return paid ? s : s + r.total
  }, 0)
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? 'All time'

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-hair shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Sales</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            <span className="tabular">{displayed.length}</span> entries
            <span className="mx-1.5 text-hair-2">·</span>
            {periodLabel}: <span className="tabular text-accent font-medium">{formatCurrency(periodTotal)}</span>
            {unpaidTotal > 0 && (
              <>
                <span className="mx-1.5 text-hair-2">·</span>
                <span className="text-warn font-medium">
                  {formatCurrency(unpaidTotal)} unpaid
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unpaidTotal > 0 && (
            <button
              onClick={() => handleSettleAll()}
              className="px-3 py-2 rounded-lg bg-warn/15 border border-warn/40 text-warn hover:bg-warn/25 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Mark every unpaid sale as paid"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settle all ({formatCurrency(unpaidTotal)})
            </button>
          )}
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

      {/* ── Period + Channel + Paid filters ─────────────────────────────────── */}
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
          All channels
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
        <span className="w-px h-4 bg-hair mx-0.5 shrink-0" />
        {(['all','paid','unpaid'] as const).map(pf => (
          <button
            key={pf}
            onClick={() => setPaidFilter(pf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              paidFilter === pf
                ? (pf === 'unpaid' ? 'bg-warn text-canvas' : 'bg-accent text-canvas')
                : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2'
            }`}
          >
            {pf === 'all' ? 'All payment' : pf[0].toUpperCase() + pf.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Sales list (cards with inline items) ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayed.length === 0 ? (
          period === 'all' && paidFilter === 'all' && chanFilter === 'all' ? (
            <EmptyState
              icon={<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M3 19L9 11l5 5 8-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="No sales yet"
              body="Log your first sale via the POS or enter a total manually here."
              action={{ label: '+ Log a sale', onClick: () => { resetModal(); setOpen(true) } }}
              secondaryAction={{ label: 'Go to POS', href: '/pos' }}
            />
          ) : (
            <EmptyState
              compact
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 15L7 8l4 4 6-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="No sales match these filters"
              body="Try a wider date range, different channel, or change payment filter."
            />
          )
        ) : (
          <div className="divide-y divide-hair">
            {displayed.map(sale => {
              const paid = paidOverride[sale.id] ?? sale.isPaid
              return (
                <article key={sale.id} className={`px-6 py-4 transition-colors hover:bg-surface-2/40 ${!paid ? 'bg-warn/[0.03]' : ''}`}>
                  {/* Header row */}
                  <header className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-ink tabular whitespace-nowrap">
                      {new Date(sale.soldAt).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {sale.customerName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <circle cx="5" cy="3.2" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M1.5 9c.5-1.6 2-2.5 3.5-2.5S8 7.4 8.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {sale.customerName}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${CHANNEL_BADGE[sale.channel] ?? 'bg-surface-3 text-ink-3'}`}>
                      {CHANNELS.find(c => c.value === sale.channel)?.label ?? sale.channel}
                    </span>

                    {/* Paid/Unpaid status — toggle on click. Unpaid rows also
                        get a dedicated "Mark paid" CTA next to it for speed. */}
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(sale.id, paid)}
                      title={paid ? 'Tap to mark as unpaid' : 'Tap to mark as paid'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border transition-colors ${
                        paid
                          ? 'bg-success/15 text-success border-success/30 hover:bg-success/25'
                          : 'bg-warn/15 text-warn border-warn/30 hover:bg-warn/25'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${paid ? 'bg-success' : 'bg-warn animate-pulse'}`} />
                      {paid ? 'Paid' : 'Unpaid'}
                    </button>
                    {!paid && (
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(sale.id, paid)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-accent text-canvas hover:bg-accent-2 transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                          <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Mark paid
                      </button>
                    )}

                    <div className="flex-1 min-w-0" />

                    <span className="tabular font-semibold text-accent text-base whitespace-nowrap">
                      {formatCurrency(sale.total)}
                    </span>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sale.id) }}
                      className={`transition-colors p-1 rounded text-xs font-semibold ${
                        pendingDelete === sale.id
                          ? 'text-danger'
                          : 'text-ink-4 hover:text-danger'
                      }`}
                      aria-label="Delete sale"
                    >
                      {pendingDelete === sale.id ? 'Confirm?' : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 7.2A1 1 0 004.7 12h4.6a1 1 0 001-.9L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </header>

                  {/* Items breakdown — inline, no click required */}
                  {sale.items.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-hair overflow-hidden bg-surface/40">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-2/50">
                            <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Item</th>
                            <th className="px-3 py-1.5 text-center text-[10px] font-semibold text-ink-4 uppercase tracking-wider w-14">Qty</th>
                            <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider w-24">Price</th>
                            <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider w-28">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hair">
                          {sale.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-3 py-1.5 text-ink">
                                {item.dishName ?? <span className="text-ink-4 italic">deleted item</span>}
                              </td>
                              <td className="px-3 py-1.5 text-center tabular text-ink-3">{item.qty}</td>
                              <td className="px-3 py-1.5 text-right tabular text-ink-3">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-3 py-1.5 text-right tabular font-medium text-ink">{formatCurrency(item.qty * item.unitPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-ink-4 italic">Manual total · no item breakdown</p>
                  )}

                  {sale.note && (
                    <p className="mt-2 text-xs text-ink-4">
                      <span className="text-ink-3 font-medium">Note:</span> {sale.note}
                    </p>
                  )}
                </article>
              )
            })}
            {/* Period total footer */}
            <div className="px-6 py-3 bg-surface-2/40 flex items-center justify-between text-xs">
              <span className="text-ink-4 font-medium">
                {periodLabel} · {displayed.length} {displayed.length === 1 ? 'entry' : 'entries'}
              </span>
              <span className="tabular font-semibold text-ink">{formatCurrency(periodTotal)}</span>
            </div>
          </div>
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

          {/* Unpaid toggle for open tabs / utang / pending GCash */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newSaleUnpaid}
              onChange={e => setNewSaleUnpaid(e.target.checked)}
              className="w-4 h-4 rounded border-hair bg-canvas text-warn focus:ring-warn/30 cursor-pointer"
            />
            <span className="text-sm text-ink-3">
              Mark as <span className="text-warn font-medium">unpaid</span> <span className="text-ink-4">(open tab / utang / pending GCash)</span>
            </span>
          </label>

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

'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

export interface TopDish {
  dishName: string
  totalQty: number
  totalRevenue: number
}

export interface MonthData {
  month: string
  label: string
  revenue: number
  expenses: number
  wasteTotal: number
  profit: number
  margin: number | null
  transactionCount: number
  expenseCount: number
  wasteCount: number
  byChannel: Array<{ channel: string; label: string; amount: number; pct: number }>
  byCategory: Array<{ category: string; label: string; amount: number; pct: number }>
  topDishes: TopDish[]
}

interface Props {
  months: MonthData[]
  currentMonth: string
}

const CATEGORY_COLOR: Record<string, string> = {
  ingredients: 'bg-accent', labor: 'bg-sky-400', rent: 'bg-warn',
  utilities: 'bg-ink-3', marketing: 'bg-purple-400', other: 'bg-hair-2',
}
const CATEGORY_STROKE: Record<string, string> = {
  ingredients: 'var(--accent)',
  labor: 'rgb(56 189 248)',
  rent: 'var(--warn)',
  utilities: 'var(--ink-3)',
  marketing: 'rgb(192 132 252)',
  other: 'var(--hair-2)',
}
const CHANNEL_COLOR: Record<string, string> = {
  dine_in: 'bg-accent', takeout: 'bg-sky-400', delivery: 'bg-warn', other: 'bg-ink-3',
}

function DonutChart({ data, total }: { data: Array<{ category: string; label: string; pct: number }>; total: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const gap = 1.5

  // Pre-compute starting offsets in a single pass so the JSX map stays pure.
  const segments = data.reduce<Array<{ category: string; pct: number; offset: number }>>(
    (acc, { category, pct }) => {
      const prev = acc[acc.length - 1]
      const offset = prev ? prev.offset + (prev.pct / 100) * circ : 0
      acc.push({ category, pct, offset })
      return acc
    },
    [],
  )

  return (
    <div className="relative w-32 h-32 shrink-0 content-in">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
        {segments.map(({ category, pct, offset }) => {
          const len = Math.max(0, (pct / 100) * circ - gap)
          return (
            <circle
              key={category}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={CATEGORY_STROKE[category] ?? 'var(--ink-4)'}
              strokeWidth="12"
              strokeDasharray={`${len} ${circ}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] font-semibold tabular text-ink leading-none">
          {formatCurrency(total)}
        </span>
        <span className="text-[9px] text-ink-4 mt-0.5">total</span>
      </div>
    </div>
  )
}

function BarRow({ label, amount, pct, colorClass }: { label: string; amount: number; pct: number; colorClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-2 text-ink-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
          {label}
        </span>
        <span className="tabular text-ink font-medium">{formatCurrency(amount)}</span>
      </div>
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bar-enter ${colorClass} opacity-60`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-ink-4 mt-1">{pct.toFixed(1)}%</p>
    </div>
  )
}

export default function ReportsClient({ months, currentMonth }: Props) {
  const [selected, setSelected] = useState(currentMonth)
  const [sortBy, setSortBy] = useState<'revenue' | 'qty'>('revenue')
  const data = months.find(m => m.month === selected) ?? months[months.length - 1]
  const prevMonthData = months[months.findIndex(m => m.month === selected) - 1]
  const isCurrentMonth = data.month === currentMonth
  const maxRevenue = Math.max(...months.map(m => m.revenue), 1)

  function downloadCSV() {
    const fmt = (cents: number) => (cents / 100).toFixed(2)
    const lines: string[][] = [
      [`Tenda Pro P&L Report — ${data.label}`],
      [],
      ['SUMMARY', 'Amount (₱)'],
      ['Revenue', fmt(data.revenue)],
      ['Total Expenses', fmt(data.expenses)],
      ['Waste Cost', fmt(data.wasteTotal)],
      ['Gross Profit', fmt(data.profit)],
      ['Gross Margin', data.margin !== null ? `${data.margin.toFixed(1)}%` : '—'],
      [],
      ['EXPENSES BY CATEGORY', 'Amount (₱)'],
      ...data.byCategory.map(c => [c.label, fmt(c.amount)]),
      [],
      ['REVENUE BY CHANNEL', 'Amount (₱)'],
      ...data.byChannel.map(c => [c.label, fmt(c.amount)]),
      [],
      ['6-MONTH TREND', 'Revenue (₱)', 'Expenses (₱)', 'Waste (₱)', 'Profit (₱)', 'Margin'],
      ...months.map(m => [m.label, fmt(m.revenue), fmt(m.expenses), fmt(m.wasteTotal), fmt(m.profit), m.margin !== null ? `${m.margin.toFixed(1)}%` : '—']),
    ]
    const csv = lines.map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `tenda-report-${data.month}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full pb-10 space-y-5">

      {/* Header row */}
      <div className="card-enter card-d0 glass rounded-xl px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 11V8.5M5.5 11V5M9 11V7M12.5 11V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Reports</h1>
            <p className="text-sm text-ink-4 mt-0.5">
              {data.label}{isCurrentMonth && <span className="ml-2 text-accent text-xs font-semibold">current</span>}
            </p>
          </div>
        </div>
        <button onClick={downloadCSV} className="px-4 py-2 btn-primary rounded-lg text-sm flex items-center gap-2 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>
      </div>

      <>

      {/* Month pills */}
      <div className="card-enter card-d1 flex items-center gap-1.5 flex-wrap">
        {months.map(m => {
          const isSel = m.month === selected
          return (
            <button
              key={m.month}
              onClick={() => setSelected(m.month)}
              className={`px-3 pt-1.5 pb-2 rounded-xl text-xs font-medium transition-all duration-100 active:scale-[0.97] min-w-[58px] ${
                isSel
                  ? 'bg-accent text-canvas shadow-sm'
                  : 'bg-surface-2 text-ink-3 hover:text-ink hover:bg-surface-3 border border-hair'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {m.month === currentMonth ? `${m.label} ·` : m.label}
                {m.month === currentMonth && (
                  <span className={`text-[10px] ${isSel ? 'text-canvas/70' : 'text-accent'}`}>now</span>
                )}
              </div>
              <div className={`mt-1 h-0.5 rounded-full overflow-hidden ${isSel ? 'bg-canvas/30' : 'bg-surface-3'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isSel ? 'bg-canvas/80' : 'bg-accent'}`}
                  style={{ width: `${Math.round((m.revenue / maxRevenue) * 100)}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* KPI cards */}
      <div className="card-enter card-d2 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass card-glow lift rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-accent-2 to-accent" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Revenue</p>
            <div className="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 9.5L4.5 6l2 2L10 4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold tabular tracking-tight text-ink">{formatCurrency(data.revenue)}</p>
          <p className="text-[11px] text-ink-4">{data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass card-glow lift rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-danger/60 to-warn/60" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Expenses</p>
            <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center shrink-0 text-danger">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 3h10M5 3V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3M5 5.5v4.5M8 5.5v4.5M2.5 3l.6 7a1 1 0 001 .9h5.8a1 1 0 001-.9l.6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold tabular tracking-tight text-ink">{formatCurrency(data.expenses)}</p>
          <p className="text-[11px] text-ink-4">{data.expenseCount} entr{data.expenseCount !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="glass card-glow lift rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-[2px] ${data.profit >= 0 ? 'bg-success' : 'bg-danger'}`} />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Gross Profit</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${data.profit >= 0 ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'}`}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 10V7.5M4 10V5M6.5 10V7M9 10V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold tabular tracking-tight ${data.profit >= 0 ? 'text-success' : 'text-danger'}`}>
              {data.profit < 0 ? '−' : ''}{formatCurrency(Math.abs(data.profit))}
            </p>
            {data.margin !== null && (
              <span className={`text-[11px] font-semibold tabular px-1.5 py-0.5 rounded-md ${data.margin >= 0 ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                {data.margin.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-4">{data.profit >= 0 ? 'positive this month' : 'operating at a loss'}</p>
        </div>
      </div>

      {/* Waste cost info row */}
      {data.wasteTotal > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-warn/5 border border-warn/20 text-sm">
          <span className="text-ink-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warn inline-block" />
            Waste Cost
          </span>
          <span className="tabular font-medium text-warn">{formatCurrency(data.wasteTotal)}</span>
        </div>
      )}

      {/* Sales Leaderboard */}
      {data.topDishes.length > 0 && (() => {
        const sorted = [...data.topDishes].sort((a, b) =>
          sortBy === 'revenue' ? b.totalRevenue - a.totalRevenue : b.totalQty - a.totalQty
        )
        return (
          <div className="card-enter card-d3 glass card-glow rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hair flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1l1.1 3.4H10L7.2 6.5l1.1 3.4L5.5 8 2.7 9.9l1.1-3.4L1 4.4h3.4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Sales Leaderboard</p>
              </div>
              <div className="flex gap-1 bg-surface-2 rounded-lg p-0.5">
                <button
                  onClick={() => setSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors active:scale-[0.95] ${sortBy === 'revenue' ? 'bg-accent text-canvas' : 'text-ink-3 hover:text-ink'}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSortBy('qty')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors active:scale-[0.95] ${sortBy === 'qty' ? 'bg-accent text-canvas' : 'text-ink-3 hover:text-ink'}`}
                >
                  Qty
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hair text-[11px] text-ink-4 uppercase tracking-wider">
                    <th className="px-5 py-2.5 text-left font-medium w-8">#</th>
                    <th className="px-2 py-2.5 text-left font-medium">Dish</th>
                    <th className="px-5 py-2.5 text-right font-medium tabular">Revenue</th>
                    <th className="px-5 py-2.5 text-right font-medium tabular">Sold</th>
                    <th className="px-5 py-2.5 text-right font-medium">vs Last Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hair">
                  {sorted.map((dish, i) => {
                    const prev = prevMonthData?.topDishes.find(d => d.dishName === dish.dishName)
                    const momPct = prev && prev.totalRevenue > 0
                      ? ((dish.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100
                      : null
                    return (
                      <tr key={dish.dishName} className="hover:bg-surface-2 transition-colors">
                        <td className="px-5 py-3 text-[11px] font-bold text-ink-4">{i + 1}</td>
                        <td className="px-2 py-3 font-medium text-ink">{dish.dishName}</td>
                        <td className="px-5 py-3 text-right tabular font-semibold text-accent">{formatCurrency(dish.totalRevenue)}</td>
                        <td className="px-5 py-3 text-right tabular text-ink-3">{dish.totalQty}×</td>
                        <td className="px-5 py-3 text-right">
                          {momPct !== null ? (
                            <span className={`inline-flex text-[10px] font-semibold tabular px-1.5 py-0.5 rounded-md ${momPct >= 0 ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}>
                              {momPct >= 0 ? '↑' : '↓'}{Math.abs(momPct).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-4">new</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Breakdown */}
      <div className="card-enter card-d4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass card-glow rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 1.5h4.5l4 4-4.5 4.5-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <circle cx="4" cy="4" r="1" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Expenses by Category</p>
          </div>
          {data.byCategory.length === 0 ? (
            <EmptyState
              compact
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M3 6h14M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title={`No expenses in ${data.label}`}
              body="Log expenses to see a category breakdown here."
            />
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart key={selected} data={data.byCategory} total={data.expenses} />
              <div className="flex-1 space-y-3 min-w-0">
                {data.byCategory.map(({ category, label, amount, pct }) => (
                  <BarRow key={`${selected}-${category}`} label={label} amount={amount} pct={pct} colorClass={CATEGORY_COLOR[category] ?? 'bg-ink-4'} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="glass card-glow rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 9h9M1 6.5h6M1 4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Revenue by Channel</p>
          </div>
          {data.byChannel.length === 0 ? (
            <EmptyState
              compact
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title={`No sales in ${data.label}`}
              body="Log sales via the POS or the Sales page."
            />
          ) : (
            <div className="space-y-4">
              {data.byChannel.map(({ channel, label, amount, pct }) => (
                <BarRow key={`${selected}-${channel}`} label={label} amount={amount} pct={pct} colorClass={CHANNEL_COLOR[channel] ?? 'bg-accent'} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6-month trend table */}
      <div className="card-enter card-d5 glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-hair flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 10V7.5M3.5 10V5M6 10V7M8.5 10V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">6-Month Trend</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hair">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Month</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Revenue</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Expenses</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Waste</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Profit</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {[...months].reverse().map(({ month, label, revenue, expenses, wasteTotal, profit, margin }) => {
                const isCurrent = month === currentMonth
                const isSel = month === selected
                return (
                  <tr
                    key={month}
                    onClick={() => setSelected(month)}
                    className={`transition-colors cursor-pointer ${
                      isSel ? 'bg-accent/8' : isCurrent ? 'bg-accent/5' : 'hover:bg-surface-2'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-ink">
                      <span className={isSel ? 'text-accent' : ''}>{label}</span>
                      {isCurrent && <span className="ml-2 text-[10px] text-accent font-semibold uppercase tracking-wider">now</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular text-ink">{formatCurrency(revenue)}</td>
                    <td className="px-5 py-3.5 text-right tabular text-ink-3">{formatCurrency(expenses)}</td>
                    <td className="px-5 py-3.5 text-right tabular text-warn/80">
                      {wasteTotal > 0 ? formatCurrency(wasteTotal) : <span className="text-ink-4">—</span>}
                    </td>
                    <td className={`px-5 py-3.5 text-right tabular font-medium ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {profit < 0 ? '−' : ''}{formatCurrency(Math.abs(profit))}
                    </td>
                    <td className={`px-5 py-3.5 text-right tabular ${margin === null ? 'text-ink-4' : margin < 0 ? 'text-danger' : margin >= 30 ? 'text-success' : 'text-ink-2'}`}>
                      {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      </>

    </div>
  )
}


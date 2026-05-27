'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

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
  let offset = 0
  const gap = 1.5

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
        {data.map(({ category, pct }) => {
          const len = Math.max(0, (pct / 100) * circ - gap)
          const seg = (
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
          offset += (pct / 100) * circ
          return seg
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
        <div className={`h-full rounded-full ${colorClass} opacity-60`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-ink-4 mt-1">{pct.toFixed(1)}%</p>
    </div>
  )
}

export default function ReportsClient({ months, currentMonth }: Props) {
  const [mainTab, setMainTab] = useState<'monthly'>('monthly')
  const [selected, setSelected] = useState(currentMonth)
  const data = months.find(m => m.month === selected) ?? months[months.length - 1]
  const isCurrentMonth = data.month === currentMonth
  const maxRevenue = Math.max(...months.map(m => m.revenue), 1)

  function downloadCSV() {
    const fmt = (cents: number) => (cents / 100).toFixed(2)
    const lines: string[][] = [
      [`Sizzle P&L Report — ${data.label}`],
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
      download: `sizzle-report-${data.month}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Reports</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            {data.label}{isCurrentMonth && <span className="ml-2 text-accent text-xs font-semibold">current</span>}
          </p>
        </div>
        {mainTab === 'monthly' && <button onClick={downloadCSV} className="px-4 py-2 btn-primary rounded-lg text-sm flex items-center gap-2 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>}
      </div>

      {mainTab === 'monthly' && <>

      {/* Month pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {months.map(m => {
          const isSel = m.month === selected
          return (
            <button
              key={m.month}
              onClick={() => setSelected(m.month)}
              className={`px-3 pt-1.5 pb-2 rounded-xl text-xs font-medium transition-all duration-100 min-w-[58px] ${
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass card-glow rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Revenue</p>
          <p className="text-2xl font-semibold tabular tracking-tight text-ink">{formatCurrency(data.revenue)}</p>
          <p className="text-[11px] text-ink-4">{data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass card-glow rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Total Expenses</p>
          <p className="text-2xl font-semibold tabular tracking-tight text-ink">{formatCurrency(data.expenses)}</p>
          <p className="text-[11px] text-ink-4">{data.expenseCount} entr{data.expenseCount !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="glass card-glow rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Gross Profit</p>
            {data.margin !== null && (
              <span className={`text-[11px] font-semibold tabular px-1.5 py-0.5 rounded ${data.margin >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.margin.toFixed(1)}%
              </span>
            )}
          </div>
          <p className={`text-2xl font-semibold tabular tracking-tight ${data.profit >= 0 ? 'text-success' : 'text-danger'}`}>
            {data.profit < 0 ? '−' : ''}{formatCurrency(Math.abs(data.profit))}
          </p>
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

      {/* Best sellers */}
      {data.topDishes.length > 0 && (
        <div className="glass card-glow rounded-xl p-5 space-y-4">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Best Sellers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {data.topDishes.map((dish, i) => (
              <div key={dish.dishName} className="rounded-lg bg-surface-2 border border-hair px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-ink-4">#{i + 1}</span>
                  <span className="text-xs font-medium text-ink truncate">{dish.dishName}</span>
                </div>
                <p className="text-sm tabular font-semibold text-accent">{formatCurrency(dish.totalRevenue)}</p>
                <p className="text-[10px] text-ink-4 tabular">{dish.totalQty} sold</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass card-glow rounded-xl p-5 space-y-4">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Expenses by Category</p>
          {data.byCategory.length === 0 ? (
            <p className="text-sm text-ink-4 py-6 text-center">No expenses in {data.label}</p>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart data={data.byCategory} total={data.expenses} />
              <div className="flex-1 space-y-3 min-w-0">
                {data.byCategory.map(({ category, label, amount, pct }) => (
                  <BarRow key={category} label={label} amount={amount} pct={pct} colorClass={CATEGORY_COLOR[category] ?? 'bg-ink-4'} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="glass card-glow rounded-xl p-5 space-y-4">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Revenue by Channel</p>
          {data.byChannel.length === 0 ? (
            <p className="text-sm text-ink-4 py-6 text-center">No sales in {data.label}</p>
          ) : (
            <div className="space-y-4">
              {data.byChannel.map(({ channel, label, amount, pct }) => (
                <BarRow key={channel} label={label} amount={amount} pct={pct} colorClass={CHANNEL_COLOR[channel] ?? 'bg-accent'} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6-month trend table */}
      <div className="glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-hair">
          <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">6-Month Trend</p>
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

      </>}
    </div>
  )
}


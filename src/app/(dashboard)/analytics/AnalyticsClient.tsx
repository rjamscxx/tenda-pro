'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyPoint   { date: string; revenue: number }
interface ForecastDay  { date: string; mid: number; low: number; high: number }
interface ExpenseCat   { category: string; amount: number }
interface MonthPnL     { month: string; revenue: number; expenses: number; profit: number }

interface Props {
  dailyRevenue:        DailyPoint[]
  revenueByDow:        number[]   // [Sun, Mon, ..., Sat]
  expensesByCategory:  ExpenseCat[]
  monthlyPnL:          MonthPnL[]
  forecastDays:        ForecastDay[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}k`
  return `₱${n.toLocaleString()}`
}
function fmtFull(n: number) { return `₱${n.toLocaleString('en-PH')}` }
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-PH', { month: 'short', year: 'numeric' })
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DOW_ORDER  = [1, 2, 3, 4, 5, 6, 0] // Mon-first display

// ── Trend Chart (90-day revenue + 7-day MA) ───────────────────────────────────

function TrendChart({ data }: { data: DailyPoint[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)
  const W = 600, H = 160, PAD = 4

  const values = data.map(d => d.revenue)
  const maxV = Math.max(...values, 1)

  const xScale = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const yScale = (v: number) => H - PAD - (v / maxV) * (H - PAD * 2)

  // 7-day moving average
  const ma: (number | null)[] = data.map((_, i) => {
    if (i < 6) return null
    return data.slice(i - 6, i + 1).reduce((s, d) => s + d.revenue, 0) / 7
  })

  // Area path
  const pts = data.map((d, i) => [xScale(i), yScale(d.revenue)] as [number, number])
  const area = `M${pts[0][0].toFixed(1)},${H} ${pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} L${pts[pts.length - 1][0].toFixed(1)},${H} Z`

  // MA line
  const maPoints = ma.map((v, i) => v !== null ? [xScale(i), yScale(v)] as [number, number] : null)
  const maSegs: [number, number][][] = []
  let seg: [number, number][] = []
  for (const p of maPoints) {
    if (p) { seg.push(p) } else { if (seg.length) maSegs.push(seg); seg = [] }
  }
  if (seg.length) maSegs.push(seg)

  // Tick labels (show ~5 dates)
  const tickIndices = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 20}`}
        className="w-full"
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={e => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const mx = (e.clientX - rect.left) / rect.width * W
          const idx = Math.round(((mx - PAD) / (W - PAD * 2)) * (data.length - 1))
          const clamped = Math.max(0, Math.min(data.length - 1, idx))
          const d = data[clamped]
          if (d) setTooltip({ x: xScale(clamped), y: yScale(d.revenue), label: `${fmtDate(d.date)}: ${fmtFull(d.revenue)}` })
        }}
      >
        {/* Area */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />

        {/* MA line */}
        {maSegs.map((s, si) => (
          <polyline key={si}
            points={s.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
            fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
          />
        ))}

        {/* Tick labels */}
        {tickIndices.map(i => (
          <text key={i} x={xScale(i)} y={H + 14} textAnchor="middle"
            fontSize="9" fill="var(--ink-4)" fontFamily="var(--font-geist-mono, monospace)">
            {fmtDate(data[i].date)}
          </text>
        ))}

        {/* Tooltip dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r="3.5" fill="var(--accent)" />
        )}
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-hair rounded-lg px-2.5 py-1 text-xs text-ink whitespace-nowrap shadow-lg"
          style={{ transform: `translateX(calc(${(tooltip.x / W) * 100}% - 50%))`, left: 0, bottom: 28 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  )
}

// ── Day-of-Week Chart ─────────────────────────────────────────────────────────

function DowChart({ revenueByDow }: { revenueByDow: number[] }) {
  const displayed = DOW_ORDER.map(i => ({ label: DOW_LABELS[i], value: revenueByDow[i] }))
  const maxVal = Math.max(...displayed.map(d => d.value), 1)
  const bestIdx = displayed.reduce((best, d, i) => d.value > displayed[best].value ? i : best, 0)

  return (
    <div className="space-y-2.5">
      {displayed.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-ink-4 w-7 shrink-0 tabular">{d.label}</span>
          <div className="flex-1 h-5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%`,
                background: i === bestIdx ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 40%, var(--surface-3))',
              }}
            />
          </div>
          <span className="text-xs tabular text-ink w-16 text-right shrink-0">
            {d.value > 0 ? fmt(d.value) : <span className="text-ink-4">—</span>}
          </span>
          {i === bestIdx && d.value > 0 && (
            <span className="text-[10px] text-accent font-semibold shrink-0">Best</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Expense Category Chart ────────────────────────────────────────────────────

function ExpenseChart({ data }: { data: ExpenseCat[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0) || 1
  const COLORS = ['var(--accent)', '#F97316', '#EAB308', '#EC4899', '#8B5CF6', '#14B8A6']

  if (data.length === 0) {
    return <p className="text-sm text-ink-4 py-6 text-center">No expenses in the last 90 days.</p>
  }

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.category} className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="text-xs text-ink-3 flex-1 truncate">{d.category}</span>
          <div className="w-24 h-2 bg-surface rounded-full overflow-hidden shrink-0">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.amount / total) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="text-xs tabular text-ink w-16 text-right shrink-0">{fmt(d.amount)}</span>
          <span className="text-xs tabular text-ink-4 w-8 text-right shrink-0">{((d.amount / total) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Forecast Card ─────────────────────────────────────────────────────────────

function ForecastCard({ days }: { days: ForecastDay[] }) {
  const total = days.reduce((s, d) => s + d.mid, 0)
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-4">Projected next 7 days</p>
        <p className="text-sm font-semibold text-accent tabular">{fmt(total)}</p>
      </div>
      <div className="space-y-1.5">
        {days.map(d => {
          const dow = new Date(d.date + 'T12:00:00').getDay()
          return (
            <div key={d.date} className="flex items-center gap-3 py-1 border-b border-hair last:border-0">
              <span className="text-xs text-ink-4 w-8 shrink-0">{DOW[dow]}</span>
              <span className="text-xs text-ink-4 w-20 shrink-0">{fmtDate(d.date)}</span>
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-xs text-ink-4 tabular w-14 text-right">{fmt(d.low)}</span>
                <div className="flex-1 relative h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 rounded-full bg-accent/30"
                    style={{ left: '0%', right: '0%' }} />
                </div>
                <span className="text-xs text-ink-4 tabular w-14">{fmt(d.high)}</span>
              </div>
              <span className="text-xs font-semibold tabular text-ink w-16 text-right shrink-0">{fmt(d.mid)}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-ink-4">Based on your historical day-of-week averages. ±18% confidence band.</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsClient({ dailyRevenue, revenueByDow, expensesByCategory, monthlyPnL, forecastDays }: Props) {
  const totalRevenue90 = dailyRevenue.reduce((s, d) => s + d.revenue, 0)
  const daysWithSales  = dailyRevenue.filter(d => d.revenue > 0).length
  const avgDaily       = daysWithSales > 0 ? Math.round(totalRevenue90 / daysWithSales) : 0
  const bestDowIdx     = revenueByDow.reduce((best, v, i) => v > revenueByDow[best] ? i : best, 0)
  const forecastTotal  = forecastDays.reduce((s, d) => s + d.mid, 0)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full pb-10">

      {/* Header */}
      <div className="card-enter card-d0 glass rounded-xl px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L5.5 7.5 8 10l3.5-5 3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Advanced Analytics</h1>
            <p className="text-xs text-ink-4 mt-0.5">90-day insights + 7-day revenue forecast</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warn/12 text-warn text-[11px] font-semibold border border-warn/20 shrink-0">
          Premium
        </span>
      </div>

      {/* KPI cards */}
      <div className="card-enter card-d1 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-accent-2 to-accent" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-4 uppercase tracking-widest font-medium">90-Day Revenue</p>
            <div className="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 9.5L4.5 6l2 2L10 4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-[1.5rem] font-bold tabular tracking-tight leading-none text-ink">{fmt(totalRevenue90)}</p>
          <p className="text-[11px] text-ink-4">{daysWithSales} trading day{daysWithSales !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-accent-2 to-accent" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-4 uppercase tracking-widest font-medium">Avg / Day</p>
            <div className="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 6.5h10M4 4l-2.5 2.5L4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-[1.5rem] font-bold tabular tracking-tight leading-none text-ink">{avgDaily > 0 ? fmt(avgDaily) : '—'}</p>
          <p className="text-[11px] text-ink-4">per trading day</p>
        </div>
        <div className="glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-success to-success/60" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-4 uppercase tracking-widest font-medium">Best Day</p>
            <div className="w-7 h-7 rounded-lg bg-success/12 flex items-center justify-center shrink-0 text-success">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1l1.3 4H12L8.8 7.5l1.3 4L6.5 9.5 3.2 11.5l1.3-4L1 5h4.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-[1.5rem] font-bold tracking-tight leading-none text-ink">{revenueByDow[bestDowIdx] > 0 ? DOW_LABELS[bestDowIdx] : '—'}</p>
          {revenueByDow[bestDowIdx] > 0 && (
            <p className="text-[11px] tabular text-accent">{fmt(revenueByDow[bestDowIdx])} avg</p>
          )}
        </div>
        <div className="glass card-glow rounded-xl p-4 space-y-2.5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent-2 to-accent" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-4 uppercase tracking-widest font-medium">7-Day Forecast</p>
            <div className="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 3.5h10M1.5 6.5h7M1.5 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="11" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </div>
          </div>
          <p className="text-[1.5rem] font-bold tabular tracking-tight leading-none text-accent">{forecastTotal > 0 ? fmt(forecastTotal) : '—'}</p>
          <p className="text-[11px] text-ink-4">projected next 7 days</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <section className="card-enter card-d2 glass card-glow rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 8.5L3.5 5.5 5.5 7.5 8.5 3.5 10 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">90-Day Revenue Trend</p>
            <p className="text-xs text-ink-4 mt-0.5">Line shows 7-day moving average</p>
          </div>
        </div>
        <TrendChart data={dailyRevenue} />
      </section>

      {/* Day of Week + Forecast */}
      <div className="card-enter card-d3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="glass card-glow rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="2" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5h9M4 2V1M7 2V1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Revenue by Day of Week</p>
              <p className="text-xs text-ink-4 mt-0.5">Average revenue per day (last 90 days)</p>
            </div>
          </div>
          <DowChart revenueByDow={revenueByDow} />
        </section>

        <section className="glass card-glow rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 5.5h9M7 3l2.5 2.5L7 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">7-Day Revenue Forecast</p>
              <p className="text-xs text-ink-4 mt-0.5">Predicted from your day-of-week history</p>
            </div>
          </div>
          <ForecastCard days={forecastDays} />
        </section>
      </div>

      {/* Expense Breakdown */}
      <section className="card-enter card-d4 glass card-glow rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 1.5h4.5l4 4-4.5 4.5-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <circle cx="4" cy="4" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Expense Breakdown — Last 90 Days</p>
            <p className="text-xs text-ink-4 mt-0.5">{expensesByCategory.length > 0 ? fmt(expensesByCategory.reduce((s, d) => s + d.amount, 0)) + ' total by category' : 'no expenses yet'}</p>
          </div>
        </div>
        <ExpenseChart data={expensesByCategory} />
      </section>

      {/* Monthly P&L */}
      <section className="card-enter card-d5 glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-hair flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-dim flex items-center justify-center shrink-0 text-accent">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 10V7.5M3.5 10V5M6 10V7M8.5 10V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Monthly P&L</p>
            <p className="text-xs text-ink-4 mt-0.5">Last 6 months — revenue, expenses, and profit</p>
          </div>
        </div>
        <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hair">
                <th className="text-left py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">Month</th>
                <th className="text-right py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">Revenue</th>
                <th className="text-right py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">Expenses</th>
                <th className="text-right py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">Profit</th>
                <th className="text-right py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody>
              {monthlyPnL.map((row, i) => {
                const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
                const isProfit = row.profit >= 0
                const isCurrent = i === monthlyPnL.length - 1
                return (
                  <tr key={row.month} className={`border-b border-hair last:border-0 ${isCurrent ? 'bg-accent/5' : ''}`}>
                    <td className="py-2.5 text-sm text-ink font-medium">
                      {fmtMonth(row.month)}
                      {isCurrent && <span className="ml-1.5 text-[10px] text-accent font-semibold">Current</span>}
                    </td>
                    <td className="py-2.5 text-right tabular text-ink text-sm">{row.revenue > 0 ? fmt(row.revenue) : <span className="text-ink-4">—</span>}</td>
                    <td className="py-2.5 text-right tabular text-ink text-sm">{row.expenses > 0 ? fmt(row.expenses) : <span className="text-ink-4">—</span>}</td>
                    <td className={`py-2.5 text-right tabular text-sm font-semibold ${row.profit === 0 ? 'text-ink-4' : isProfit ? 'text-success' : 'text-danger'}`}>
                      {row.profit === 0 ? '—' : `${isProfit ? '+' : ''}${fmt(row.profit)}`}
                    </td>
                    <td className={`py-2.5 text-right tabular text-sm ${row.revenue === 0 ? 'text-ink-4' : margin >= 20 ? 'text-success' : margin >= 0 ? 'text-ink-3' : 'text-danger'}`}>
                      {row.revenue > 0 ? `${margin.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </div>
      </section>

    </div>
  )
}

'use client'

import { useState } from 'react'

export interface ChartPoint {
  date: string    // YYYY-MM-DD
  revenue: number // pesos
  expenses: number
}

const W = 600
const H = 160

function ceil1k(n: number) { return Math.ceil(n / 1000) * 1000 || 1000 }

function fmtAmt(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}k`
  return `₱${n}`
}

function fmtDay(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function area(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const path = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')
  return `M${pts[0][0].toFixed(1)},${H} L${path} L${pts[pts.length - 1][0].toFixed(1)},${H} Z`
}

function line(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export default function CashflowChart({ data }: { data: ChartPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-ink-4">No data yet — start logging sales and expenses.</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.flatMap(d => [d.revenue, d.expenses]), 100)
  const yMax = ceil1k(maxVal)
  const n = data.length

  const xPx = (i: number) => (i / (n - 1)) * W
  const yPx = (v: number) => H - (v / yMax) * H

  const revPts: [number, number][] = data.map((d, i) => [xPx(i), yPx(d.revenue)])
  const expPts: [number, number][] = data.map((d, i) => [xPx(i), yPx(d.expenses)])

  const TICKS = 4
  const yTicks = Array.from({ length: TICKS + 1 }, (_, i) => (i / TICKS) * yMax)

  const xInterval = Math.max(1, Math.floor(n / 5))
  const xLabels = data
    .map((d, i) => ({ i, date: d.date }))
    .filter(({ i }) => i === 0 || i === n - 1 || i % xInterval === 0)

  const hovered = hover !== null ? data[hover] : null
  const slotW = W / n

  return (
    <div className="relative w-full" style={{ height: '200px' }}>
      <div className="absolute inset-0 flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pb-6 pr-2 shrink-0" style={{ width: '48px' }}>
          {[...yTicks].reverse().map(v => (
            <span key={v} className="text-[10px] text-ink-4 text-right leading-none block">{fmtAmt(v)}</span>
          ))}
        </div>

        {/* Chart + X-axis */}
        <div className="relative flex-1 min-w-0">
          {/* SVG */}
          <div className="absolute inset-0 bottom-6">
            <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="g-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--danger)" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {yTicks.slice(1, TICKS).map(v => (
                <line key={v} x1="0" y1={yPx(v).toFixed(1)} x2={W} y2={yPx(v).toFixed(1)}
                  stroke="var(--hair)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              ))}

              {/* Areas */}
              <path d={area(revPts)} fill="url(#g-rev)" />
              <path d={area(expPts)} fill="url(#g-exp)" />

              {/* Lines */}
              <path d={line(revPts)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path d={line(expPts)} fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

              {/* Hover */}
              {hover !== null && (
                <>
                  <line x1={xPx(hover).toFixed(1)} y1="0" x2={xPx(hover).toFixed(1)} y2={H}
                    stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                  <circle cx={xPx(hover)} cy={yPx(data[hover].revenue)} r="3.5"
                    fill="var(--accent)" stroke="var(--canvas)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <circle cx={xPx(hover)} cy={yPx(data[hover].expenses)} r="3.5"
                    fill="var(--danger)" stroke="var(--canvas)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </>
              )}

              {/* Hit slots */}
              {data.map((_, i) => (
                <rect key={i} x={Math.max(0, xPx(i) - slotW / 2)} y={0} width={slotW} height={H}
                  fill="transparent" style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              ))}
            </svg>
          </div>

          {/* X labels */}
          <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none">
            {xLabels.map(({ i, date }) => (
              <span key={i} className="absolute -translate-x-1/2 text-[10px] text-ink-4 whitespace-nowrap"
                style={{ left: `${(i / (n - 1)) * 100}%`, top: '2px' }}>
                {fmtDay(date)}
              </span>
            ))}
          </div>

          {/* Tooltip */}
          {hover !== null && hovered && (() => {
            const pct = hover / (n - 1)
            const toRight = pct <= 0.65
            return (
              <div
                className="absolute top-0 pointer-events-none z-10 glass rounded-lg px-2.5 py-2 shadow-lg"
                style={toRight
                  ? { left: `${pct * 100}%`, transform: 'translateX(10px)' }
                  : { right: `${(1 - pct) * 100}%`, transform: 'translateX(-10px)' }}
              >
                <p className="text-[11px] font-semibold text-ink-3 mb-1.5">{fmtDay(hovered.date)}</p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  <span className="text-ink tabular">₱{hovered.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] mt-1">
                  <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                  <span className="text-ink tabular">₱{hovered.expenses.toLocaleString()}</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { DishData } from './DishesClient'

interface SalesPoint {
  qty: number
  revenue: number
}

interface EngineeringPoint {
  id: string
  name: string
  category: string
  price: number
  cost: number
  margin: number     // 0–100 %
  marginPHP: number  // cents
  qty: number        // units sold in 30 days
  revenue: number    // cents
  quadrant: 'star' | 'plowhorse' | 'puzzle' | 'dog'
}

const QUADRANT_META = {
  star:       { label: 'Stars',       color: 'var(--accent)',  bg: 'bg-accent/10',  desc: 'High popularity · High margin — promote these' },
  puzzle:     { label: 'Puzzles',     color: 'var(--warn)',    bg: 'bg-warn/10',    desc: 'Low popularity · High margin — need better placement or marketing' },
  plowhorse:  { label: 'Plowhorses', color: 'var(--sky-400, #38bdf8)', bg: 'bg-sky-400/10', desc: 'High popularity · Low margin — consider price or cost adjustments' },
  dog:        { label: 'Dogs',        color: 'var(--danger)',  bg: 'bg-danger/10',  desc: 'Low popularity · Low margin — consider removing' },
}

export default function EngineeringTab({
  dishes,
  salesVolume,
}: {
  dishes: DishData[]
  salesVolume: Map<string, SalesPoint>
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [filter,  setFilter]  = useState<'all' | 'star' | 'puzzle' | 'plowhorse' | 'dog'>('all')

  const points: EngineeringPoint[] = useMemo(() => {
    return dishes.map(d => {
      const cost = d.recipeItems.reduce(
        (s, ri) => s + ri.qty * ri.ingredient.costPerUnit,
        0,
      )
      const margin    = d.price > 0 ? ((d.price - cost) / d.price) * 100 : 0
      const marginPHP = d.price - cost
      const sv        = salesVolume.get(d.id) ?? { qty: 0, revenue: 0 }
      return { id: d.id, name: d.name, category: d.category, price: d.price, cost, margin, marginPHP, qty: sv.qty, revenue: sv.revenue, quadrant: 'dog' as const }
    })
  }, [dishes, salesVolume])

  // Compute medians for quadrant cutoffs
  const { medianQty, medianMargin } = useMemo(() => {
    const qtys    = points.map(p => p.qty).sort((a, b) => a - b)
    const margins = points.filter(p => p.price > 0).map(p => p.margin).sort((a, b) => a - b)
    const mid = (arr: number[]) => arr.length === 0 ? 0 : arr.length % 2 === 1
      ? arr[Math.floor(arr.length / 2)]
      : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2
    return { medianQty: mid(qtys), medianMargin: mid(margins) }
  }, [points])

  const classified: EngineeringPoint[] = useMemo(() => {
    return points.map(p => ({
      ...p,
      quadrant: p.qty > medianQty && p.margin >= medianMargin ? 'star'
              : p.qty > medianQty && p.margin <  medianMargin ? 'plowhorse'
              : p.qty <= medianQty && p.margin >= medianMargin ? 'puzzle'
              : 'dog',
    }))
  }, [points, medianQty, medianMargin])

  const maxQty    = Math.max(...classified.map(p => p.qty), 1)
  const maxMargin = Math.max(...classified.map(p => p.margin), 1)

  const visible = filter === 'all' ? classified : classified.filter(p => p.quadrant === filter)

  const counts = {
    star:      classified.filter(p => p.quadrant === 'star').length,
    puzzle:    classified.filter(p => p.quadrant === 'puzzle').length,
    plowhorse: classified.filter(p => p.quadrant === 'plowhorse').length,
    dog:       classified.filter(p => p.quadrant === 'dog').length,
  }

  if (dishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-ink-4">
        Add dishes with recipes to see the engineering quadrant.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Quadrant filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'star', 'puzzle', 'plowhorse', 'dog'] as const).map(q => {
          const count = q === 'all' ? classified.length : counts[q]
          const meta  = q === 'all' ? null : QUADRANT_META[q]
          return (
            <button
              key={q}
              onClick={() => setFilter(q)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === q ? 'bg-accent text-canvas' : 'bg-surface-2 text-ink-3 hover:text-ink'
              }`}
            >
              {meta && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
              )}
              {q === 'all' ? 'All dishes' : meta!.label}
              <span className="opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Quadrant legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.entries(QUADRANT_META) as [keyof typeof QUADRANT_META, typeof QUADRANT_META[keyof typeof QUADRANT_META]][]).map(([key, m]) => (
          <div key={key} className={`rounded-lg px-3 py-2.5 ${m.bg}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
              <p className="text-xs font-semibold text-ink">{m.label}</p>
              <span className="ml-auto text-xs tabular font-bold text-ink">{counts[key]}</span>
            </div>
            <p className="text-[10px] text-ink-4 leading-snug">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="glass rounded-xl p-4 sm:p-5">
        <div className="flex items-end justify-between mb-2">
          <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">Margin % →</p>
          <p className="text-[10px] text-ink-4 uppercase tracking-widest font-medium">← Popularity (units sold / 30 days)</p>
        </div>
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ paddingTop: '62%', background: 'var(--surface-2)' }}
        >
          {/* Quadrant dividers */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 border border-hair rounded-lg" />
            {/* Vertical median line */}
            <div className="absolute top-0 bottom-0 border-l border-dashed border-hair-2" style={{ left: '50%' }} />
            {/* Horizontal median line */}
            <div className="absolute left-0 right-0 border-t border-dashed border-hair-2" style={{ top: '50%' }} />
            {/* Quadrant labels */}
            <span className="absolute top-2 left-2 text-[9px] text-ink-4 opacity-50">Puzzles</span>
            <span className="absolute top-2 right-2 text-[9px] text-ink-4 opacity-50 text-right">Stars</span>
            <span className="absolute bottom-2 left-2 text-[9px] text-ink-4 opacity-50">Dogs</span>
            <span className="absolute bottom-2 right-2 text-[9px] text-ink-4 opacity-50 text-right">Plowhorses</span>

            {/* Data points */}
            {classified.map(p => {
              const x = maxMargin > 0 ? (p.margin / maxMargin) * 92 + 4 : 50
              const y = maxQty > 0 ? 100 - ((p.qty / maxQty) * 88 + 4) : 50
              const meta = QUADRANT_META[p.quadrant]
              const isHovered = hovered === p.id
              const isVisible = filter === 'all' || filter === p.quadrant

              return (
                <div
                  key={p.id}
                  className="absolute transition-all duration-200 cursor-pointer"
                  style={{
                    left:      `${x}%`,
                    top:       `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex:    isHovered ? 30 : 10,
                    opacity:   isVisible ? 1 : 0.15,
                  }}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="rounded-full border-2 border-canvas transition-all duration-150"
                    style={{
                      width:      isHovered ? 18 : 12,
                      height:     isHovered ? 18 : 12,
                      background: meta.color,
                      boxShadow:  isHovered ? `0 0 0 3px ${meta.color}40` : undefined,
                    }}
                  />
                  {isHovered && (
                    <div
                      className="absolute z-40 pointer-events-none min-w-[160px] rounded-lg border border-hair bg-surface shadow-lg px-3 py-2.5 space-y-1"
                      style={{ top: '-8px', left: '20px' }}
                    >
                      <p className="text-xs font-semibold text-ink leading-tight">{p.name}</p>
                      <p className="text-[10px] text-ink-4">{p.category}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1">
                        <span className="text-[10px] text-ink-4">Price</span>
                        <span className="text-[10px] tabular text-ink">{formatCurrency(p.price)}</span>
                        <span className="text-[10px] text-ink-4">Food cost</span>
                        <span className="text-[10px] tabular text-ink">{formatCurrency(Math.round(p.cost))}</span>
                        <span className="text-[10px] text-ink-4">Margin</span>
                        <span className="text-[10px] tabular text-ink">{p.margin.toFixed(1)}%</span>
                        <span className="text-[10px] text-ink-4">Sold (30d)</span>
                        <span className="text-[10px] tabular text-ink">{p.qty}×</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-ink-4">
          <span>Low margin →</span>
          <span>← High margin</span>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hair">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-4 uppercase tracking-widest">Dish</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-ink-4 uppercase tracking-widest hidden sm:table-cell">Price</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-ink-4 uppercase tracking-widest">Margin</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-ink-4 uppercase tracking-widest hidden sm:table-cell">Sold 30d</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-ink-4 uppercase tracking-widest">Quadrant</th>
            </tr>
          </thead>
          <tbody>
            {visible.sort((a, b) => b.margin - a.margin).map(p => {
              const meta = QUADRANT_META[p.quadrant]
              return (
                <tr key={p.id} className="border-b border-hair last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink text-sm">{p.name}</p>
                    <p className="text-xs text-ink-4">{p.category}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular text-ink text-sm hidden sm:table-cell">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm tabular font-semibold ${
                      p.margin >= 60 ? 'text-success' : p.margin >= 40 ? 'text-ink' : 'text-warn'
                    }`}>
                      {p.margin.toFixed(1)}%
                    </span>
                    <p className="text-[10px] tabular text-ink-4">{formatCurrency(Math.round(p.marginPHP))}/ea</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular text-ink-3 text-sm hidden sm:table-cell">
                    {p.qty}×
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: `${meta.color}18`, color: meta.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                      {meta.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="text-sm text-ink-4 text-center py-8">No dishes in this quadrant.</p>
        )}
      </div>
    </div>
  )
}

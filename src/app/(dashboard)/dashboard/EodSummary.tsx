'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

interface TopDish {
  dishName: string | null
  totalQty: number
  totalRevenue: number
}

interface Props {
  venueName: string
  revenueToday: number
  expensesToday: number
  wasteToday: number
  transactionCount: number
  topDishes: TopDish[]
  todayStr: string
}

export default function EodSummary({
  venueName,
  revenueToday,
  expensesToday,
  wasteToday,
  transactionCount,
  topDishes,
  todayStr,
}: Props) {
  const [open, setOpen] = useState(false)

  const netPnl = revenueToday - expensesToday - wasteToday
  const isProfitable = netPnl >= 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-surface-2 border border-hair text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4 5h6M4 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Close of Day
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${venueName} — End of Day`}
      >
        <div className="space-y-4">

          {/* Date label */}
          <p className="text-[11px] font-medium text-ink-4 uppercase tracking-widest -mt-1">{todayStr}</p>

          {/* Revenue */}
          <div className="rounded-xl bg-surface-2 border border-hair px-4 py-3.5 space-y-1">
            <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Revenue</p>
            <p className="text-3xl font-semibold tabular tracking-tight text-ink">{formatCurrency(revenueToday)}</p>
            <p className="text-[11px] text-ink-4">
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} today
            </p>
          </div>

          {/* Expenses + Waste rows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-ink-3">Expenses logged</span>
              <span className="tabular text-sm font-medium text-ink">{formatCurrency(expensesToday)}</span>
            </div>
            {wasteToday > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-ink-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn inline-block" />
                  Waste cost
                </span>
                <span className="tabular text-sm font-medium text-warn">{formatCurrency(wasteToday)}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-hair" />

          {/* Net P&L */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Net P&amp;L</span>
            <span className={`tabular text-xl font-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
              {netPnl < 0 ? '−' : ''}{formatCurrency(Math.abs(netPnl))}
            </span>
          </div>

          {/* Top dishes */}
          {topDishes.length > 0 && (
            <>
              <div className="h-px bg-hair" />
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-ink-3 uppercase tracking-widest">Top Dishes Today</p>
                <div className="space-y-1.5">
                  {topDishes.map((dish, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="text-[10px] font-bold text-ink-4 w-4 tabular shrink-0">{i + 1}</span>
                      <span className="flex-1 text-ink truncate">{dish.dishName ?? '—'}</span>
                      <span className="tabular text-ink-3 shrink-0">{dish.totalQty}×</span>
                      <span className="tabular font-semibold text-accent shrink-0">{formatCurrency(dish.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 rounded-lg bg-surface-2 border border-hair text-sm text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M3 4V1h7v3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <rect x="1" y="4" width="11" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3 9v3h7V9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              Print
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg btn-primary text-sm"
            >
              Done
            </button>
          </div>

        </div>
      </Modal>
    </>
  )
}

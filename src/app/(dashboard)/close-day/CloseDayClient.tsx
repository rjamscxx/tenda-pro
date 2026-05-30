'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { emailCloseOut } from './actions'
import { settleAllUnpaid } from '../sales/actions'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

interface Kpi {
  revenue: number; tickets: number; unpaid: number; cogs: number;
  expenses: number; waste: number; net: number; today: string;
}
interface TopSeller { dishName: string; qty: number; revenue: number }
interface Expense { id: string; category: string; amount: number; vendor: string | null; note: string | null }
interface WasteRow { id: string; ingredientName: string; qty: string; unit: string; reason: string; estimatedCost: number }
interface OpenTab { id: string; soldAt: string; total: number; customerName: string | null; note: string | null; channel: string }

export default function CloseDayClient({
  venueName, ownerName, today, kpi, topSellers, expenses, waste, openTabs,
}: {
  venueName: string
  ownerEmail: string | null
  ownerName: string | null
  today: string
  kpi: Kpi
  topSellers: TopSeller[]
  expenses: Expense[]
  waste: WasteRow[]
  openTabs: OpenTab[]
}) {
  const toast = useToast()
  const [sending, setSending] = useState(false)
  const [, startTransition] = useTransition()
  const [emailedTo, setEmailedTo] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)

  const foodCostPct  = kpi.revenue > 0 ? (kpi.cogs / kpi.revenue * 100).toFixed(1) : '—'
  const marginPct    = kpi.revenue > 0 ? ((kpi.revenue - kpi.cogs) / kpi.revenue * 100).toFixed(1) : '—'
  const netClass     = kpi.net > 0 ? 'text-success' : kpi.net < 0 ? 'text-danger' : 'text-ink-3'

  const dateLabel = new Date(`${today}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  async function handleEmail() {
    setSending(true)
    const res = await emailCloseOut()
    setSending(false)
    if (res?.error) { toast(res.error, 'error'); return }
    if (res?.ok) {
      setEmailedTo(res.to ?? null)
      toast('Close-out emailed', 'info')
    }
  }

  function handleSettle() {
    if (settled) return
    if (!confirm(`Mark ${openTabs.length} open tab${openTabs.length === 1 ? '' : 's'} as paid (${formatCurrency(kpi.unpaid)})?`)) return
    setSettled(true)
    startTransition(() => {
      settleAllUnpaid().then(({ settled: n }) => {
        toast(`Settled ${n}`, 'info')
      }).catch(() => {
        setSettled(false)
        toast('Settle failed', 'error')
      })
    })
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #close-day-printable, #close-day-printable * { visibility: visible !important; }
          #close-day-printable { position: fixed !important; inset: 0 !important; padding: 24px !important; background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Close of day</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">{venueName}</h1>
          <p className="text-sm text-ink-3 mt-0.5">{dateLabel} · {kpi.tickets} {kpi.tickets === 1 ? 'sale' : 'sales'}</p>
          {ownerName && <p className="text-xs text-ink-4 mt-0.5">Hi {ownerName.split(' ')[0]} 👋</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium transition-colors">
            ← Dashboard
          </Link>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium transition-colors"
          >
            Print
          </button>
          <button
            onClick={handleEmail}
            disabled={sending}
            className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M2 4l5 4 5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sending ? 'Sending…' : 'Email me this'}
          </button>
        </div>
      </header>
      {emailedTo && (
        <p className="text-xs text-success no-print">✓ Sent to {emailedTo}</p>
      )}

      {/* Printable area */}
      <div id="close-day-printable" className="space-y-6">

        {/* Hero net profit card */}
        <div className="glass rounded-2xl p-6 sm:p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">Net profit today</p>
          <p className={`text-5xl font-bold tabular mt-2 ${netClass}`}>{formatCurrency(kpi.net)}</p>
          <p className="text-xs text-ink-4 mt-2">
            from {formatCurrency(kpi.revenue)} revenue · {foodCostPct}% food cost · {marginPct}% gross margin
          </p>
        </div>

        {/* P&L breakdown */}
        <section className="glass rounded-2xl p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">P&L</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-hair">
              <tr>
                <td className="py-2.5 text-ink">Revenue</td>
                <td className="py-2.5 text-right tabular font-semibold text-success">{formatCurrency(kpi.revenue)}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-ink-3 pl-4">Food cost (COGS)</td>
                <td className="py-2.5 text-right tabular text-ink-2">− {formatCurrency(kpi.cogs)}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-ink-3 pl-4">Other expenses</td>
                <td className="py-2.5 text-right tabular text-ink-2">− {formatCurrency(kpi.expenses)}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-ink-3 pl-4">Waste</td>
                <td className="py-2.5 text-right tabular text-ink-2">− {formatCurrency(kpi.waste)}</td>
              </tr>
              <tr className="border-t border-hair-2">
                <td className="py-3 font-bold text-ink">Net profit</td>
                <td className={`py-3 text-right tabular font-bold text-base ${netClass}`}>{formatCurrency(kpi.net)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Open tabs (the most important section — Lina shouldn't forget these) */}
        {openTabs.length > 0 && !settled && (
          <section className="rounded-2xl p-5 sm:p-6 border border-warn/40 bg-warn/5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-warn">⚠ Open tabs ({openTabs.length})</p>
                <p className="text-sm text-ink-3 mt-1">Total <span className="tabular font-semibold text-warn">{formatCurrency(kpi.unpaid)}</span> still uncollected.</p>
              </div>
              <button
                onClick={handleSettle}
                className="px-4 py-2 rounded-lg bg-accent text-canvas text-xs font-bold uppercase tracking-wider hover:bg-accent-2 transition-colors no-print"
              >
                ✓ Settle all
              </button>
            </div>
            <ul className="divide-y divide-warn/20">
              {openTabs.map(t => (
                <li key={t.id} className="py-2 flex items-center gap-3 text-sm">
                  <span className="text-ink-3 tabular text-xs">
                    {new Date(t.soldAt).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex-1 text-ink font-medium truncate">
                    {t.customerName || <span className="italic text-ink-4">(no name)</span>}
                  </span>
                  {t.note && <span className="text-xs text-ink-4 italic truncate max-w-[200px]">{t.note}</span>}
                  <span className="tabular font-semibold text-warn">{formatCurrency(t.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Top sellers + expenses + waste in a 2-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <section className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">Top sellers</p>
            {topSellers.length === 0 ? (
              <p className="text-sm text-ink-4 py-4 text-center">No sales today yet.</p>
            ) : (
              <ul className="divide-y divide-hair">
                {topSellers.map(s => (
                  <li key={s.dishName} className="py-2 flex items-center gap-2 text-sm">
                    <span className="flex-1 text-ink truncate">{s.dishName}</span>
                    <span className="tabular text-ink-3 text-xs">×{s.qty}</span>
                    <span className="tabular text-accent font-semibold w-20 text-right">{formatCurrency(s.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">
              Expenses today {expenses.length > 0 && <span className="text-ink-4 normal-case font-normal">({expenses.length})</span>}
            </p>
            {expenses.length === 0 ? (
              <p className="text-sm text-ink-4 py-4 text-center">No expenses logged today.</p>
            ) : (
              <ul className="divide-y divide-hair">
                {expenses.map(e => (
                  <li key={e.id} className="py-2 flex items-center gap-2 text-sm">
                    <span className="flex-1 text-ink truncate">
                      <span className="capitalize">{e.category}</span>
                      {e.vendor && <span className="text-ink-4"> · {e.vendor}</span>}
                    </span>
                    <span className="tabular text-ink font-medium">{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {waste.length > 0 && (
            <section className="glass rounded-2xl p-5 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 mb-3">
                Waste ({waste.length}) · {formatCurrency(kpi.waste)} lost
              </p>
              <ul className="divide-y divide-hair">
                {waste.map(w => (
                  <li key={w.id} className="py-2 flex items-center gap-2 text-sm">
                    <span className="flex-1 text-ink truncate">
                      {w.ingredientName}
                      <span className="text-ink-4 uppercase ml-1.5 text-xs tracking-wider">{w.qty}{w.unit}</span>
                      <span className="text-ink-4 ml-1.5 text-xs capitalize">· {w.reason}</span>
                    </span>
                    <span className="tabular text-danger font-medium">{formatCurrency(w.estimatedCost)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

      </div>
    </div>
  )
}

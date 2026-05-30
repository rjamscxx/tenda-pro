import Link from 'next/link'
import { getTodayKpi } from '@/lib/queries/todayKpi'
import { formatCurrency } from '@/lib/utils'

/**
 * Compact "Today: ₱X rev · ₱Y net" chip that sits at the top of every
 * authed page. Server component — uses the cached getTodayKpi so it shares
 * one round-trip with anything else on the page that reads the same data.
 * Click-through goes to /close-day for the full close-out screen.
 */
export default async function TodayTicker({ venueId }: { venueId: string }) {
  const k = await getTodayKpi(venueId)

  const netTone = k.net > 0
    ? 'text-success'
    : k.net < 0
      ? 'text-danger'
      : 'text-ink-3'

  return (
    <Link
      href="/close-day"
      title="Today's running totals — click for the full close-out"
      className="flex items-center gap-3 px-4 py-1.5 border-b border-hair bg-surface/40 backdrop-blur-sm text-xs hover:bg-surface-2/60 transition-colors group"
    >
      <span className="inline-flex items-center gap-1.5 text-ink-4 uppercase tracking-widest text-[10px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
        Today
      </span>
      <span className="text-ink-3">
        Rev <span className="tabular font-semibold text-ink">{formatCurrency(k.revenue)}</span>
        <span className="text-ink-4 ml-1">· {k.tickets} {k.tickets === 1 ? 'sale' : 'sales'}</span>
      </span>
      <span className="text-hair-2">·</span>
      <span className="text-ink-3">
        Net <span className={`tabular font-bold ${netTone}`}>{formatCurrency(k.net)}</span>
      </span>
      {k.unpaid > 0 && (
        <>
          <span className="text-hair-2">·</span>
          <span className="text-warn tabular font-semibold">{formatCurrency(k.unpaid)} unpaid</span>
        </>
      )}
      <span className="flex-1" />
      <span className="text-ink-4 group-hover:text-accent transition-colors text-[10px] uppercase tracking-widest font-semibold">
        Close day →
      </span>
    </Link>
  )
}

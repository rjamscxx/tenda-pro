'use client'

interface Row {
  feature: string
  square: 'yes' | 'no' | 'partial' | string
  stitched: 'yes' | 'no' | 'partial' | string
  sizzle: 'yes' | 'no' | 'partial' | string
}

const ROWS: Row[] = [
  { feature: 'Log sales by channel (dine-in / takeout / delivery)', square: 'yes',     stitched: 'partial', sizzle: 'yes' },
  { feature: 'Real food cost per dish from recipes',                 square: 'no',      stitched: 'partial', sizzle: 'yes' },
  { feature: 'Auto inventory deduction when a dish sells',           square: 'no',      stitched: 'no',      sizzle: 'yes' },
  { feature: 'Low-stock + out-of-stock alerts',                      square: 'partial', stitched: 'no',      sizzle: 'yes' },
  { feature: 'Recurring expense automation',                         square: 'no',      stitched: 'partial', sizzle: 'yes' },
  { feature: 'Employee records + payroll runs',                      square: 'no',      stitched: 'partial', sizzle: 'yes' },
  { feature: 'Waste &amp; spoilage tracking with cost impact',       square: 'no',      stitched: 'no',      sizzle: 'yes' },
  { feature: 'Monthly P&amp;L without an accountant',                 square: 'no',      stitched: 'yes',     sizzle: 'yes' },
  { feature: 'Public QR menu for customers',                          square: 'partial', stitched: 'no',      sizzle: 'yes' },
  { feature: 'Priced in ₱, built for PH workflows',                    square: 'no',      stitched: 'no',      sizzle: 'yes' },
  { feature: 'All-in monthly cost',                                    square: '~₱1,500+', stitched: '~₱2,500+', sizzle: '₱399' },
]

function Cell({ value, highlight }: { value: string; highlight?: boolean }) {
  if (value === 'yes') {
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
          highlight ? 'bg-accent/20' : 'bg-success/10'
        }`}
        aria-label="Yes"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6.5L4.5 9 10 3.5"
            stroke={highlight ? 'var(--accent)' : 'var(--success)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (value === 'no') {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-3"
        aria-label="No"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2L2 8" stroke="var(--ink-4)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  if (value === 'partial') {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warn/10"
        aria-label="Partial"
        title="Partial — possible but limited or extra setup required"
      >
        <span className="w-2 h-2 rounded-full bg-warn" />
      </span>
    )
  }
  // Price strings or arbitrary text
  return (
    <span className={`tabular text-sm font-semibold ${highlight ? 'text-accent' : 'text-ink'}`}>
      {value}
    </span>
  )
}

export default function ComparisonTable() {
  return (
    <div>
      <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3 text-center">
        How we compare
      </p>
      <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight text-center max-w-[26ch] mx-auto">
        One tool instead of three.
      </h2>
      <p className="text-base text-ink-3 mt-4 text-center max-w-[52ch] mx-auto leading-relaxed">
        Most café owners are taping together a foreign POS, an accounting tool, and a
        spreadsheet — and still missing the numbers that matter. Here&apos;s the
        side-by-side.
      </p>

      <div className="mt-12 overflow-x-auto">
        <div className="min-w-[720px] glass rounded-2xl border border-hair overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1.1fr] gap-2 px-6 py-5 border-b border-hair bg-surface-2/40">
            <div />
            <div className="text-center">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-widest">Square POS only</p>
              <p className="text-[10px] text-ink-4 mt-1">Foreign POS</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-widest">Square + QuickBooks + Sheet</p>
              <p className="text-[10px] text-ink-4 mt-1">The usual stitched stack</p>
            </div>
            <div className="text-center rounded-xl bg-accent/10 border border-accent/20 py-1.5 -my-1.5">
              <p className="text-[11px] font-bold text-accent uppercase tracking-widest">Sizzle</p>
              <p className="text-[10px] text-accent/80 mt-1">All-in-one</p>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-hair">
            {ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_1fr_1fr_1.1fr] gap-2 items-center px-6 py-3.5"
              >
                <div
                  className="text-sm text-ink-2 leading-snug"
                  dangerouslySetInnerHTML={{ __html: row.feature }}
                />
                <div className="flex justify-center"><Cell value={row.square} /></div>
                <div className="flex justify-center"><Cell value={row.stitched} /></div>
                <div className="flex justify-center"><Cell value={row.sizzle} highlight /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-6 flex-wrap text-[11px] text-ink-4">
        <span className="inline-flex items-center gap-1.5">
          <Cell value="yes" /> Built-in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Cell value="partial" /> Partial / extra setup
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Cell value="no" /> Not available
        </span>
      </div>
    </div>
  )
}

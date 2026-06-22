export default function Loading() {
  return (
    <div className="p-6 max-w-2xl w-full space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-6 w-28 rounded shimmer" />
        <div className="h-3.5 w-56 rounded shimmer" />
      </div>
      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 0.9, 0.8, 0.7].map((op, i) => (
          <div key={i} className="rounded-xl border border-hair p-4 space-y-2" style={{ opacity: op }}>
            <div className="h-3 w-16 rounded shimmer" />
            <div className="h-6 w-20 rounded shimmer" />
          </div>
        ))}
      </div>
      {/* Section cards */}
      {[1, 0.8, 0.65].map((op, i) => (
        <div key={i} className="rounded-xl border border-hair overflow-hidden" style={{ opacity: op }}>
          <div className="px-4 py-3 border-b border-hair">
            <div className="h-4 w-32 rounded shimmer" />
          </div>
          <div className="p-4 space-y-2.5">
            {[1, 0.75, 0.5].map((rop, j) => (
              <div key={j} className="h-9 rounded-lg shimmer" style={{ opacity: rop }} />
            ))}
          </div>
        </div>
      ))}
      {/* Submit button */}
      <div className="h-11 w-full rounded-lg shimmer opacity-60" />
    </div>
  )
}

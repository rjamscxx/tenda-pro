export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-20 rounded shimmer" />
          <div className="h-4 w-32 rounded shimmer" />
        </div>
        <div className="h-9 w-28 rounded-lg shimmer" />
      </div>

      {/* Month pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[58, 58, 58, 58, 58, 58].map((w, i) => (
          <div key={i} className="h-9 rounded-xl shimmer" style={{ width: w, opacity: 1 - i * 0.1 }} />
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="glass card-glow rounded-xl p-4 space-y-3">
            <div className="h-3 w-20 rounded shimmer" />
            <div className="h-7 w-28 rounded shimmer" />
            <div className="h-3 w-16 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="glass card-glow rounded-xl p-5 space-y-4">
            <div className="h-3 w-36 rounded shimmer" />
            {[1, 0.8, 0.6].map((op, j) => (
              <div key={j} className="space-y-2" style={{ opacity: op }}>
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded shimmer" />
                  <div className="h-4 w-16 rounded shimmer" />
                </div>
                <div className="h-1.5 w-full rounded-full shimmer" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Trend table */}
      <div className="glass card-glow rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-hair">
          <div className="h-3 w-28 rounded shimmer" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-10 rounded-lg shimmer" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

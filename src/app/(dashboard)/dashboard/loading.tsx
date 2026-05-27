export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-6 w-36 rounded shimmer" />
          <div className="h-3.5 w-44 rounded shimmer" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-9 w-28 rounded-lg shimmer" />
          <div className="h-9 w-24 rounded-lg shimmer" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 0.9, 0.8, 0.7].map((op, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2.5 relative overflow-hidden" style={{ opacity: op }}>
            <div className="absolute inset-x-0 top-0 h-[2px] rounded shimmer" />
            <div className="h-3 w-20 rounded shimmer" />
            <div className="h-8 w-24 rounded shimmer" />
            <div className="h-3 w-28 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Chart + Top Sellers row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded shimmer" />
              <div className="h-3 w-20 rounded shimmer" />
            </div>
            <div className="h-3 w-24 rounded shimmer" />
          </div>
          <div className="h-40 w-full rounded-lg shimmer" />
        </div>
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="h-3 w-28 rounded shimmer" />
          {[1, 0.85, 0.7, 0.55, 0.4].map((op, i) => (
            <div key={i} className="h-6 rounded shimmer" style={{ opacity: op }} />
          ))}
        </div>
      </div>
    </div>
  )
}

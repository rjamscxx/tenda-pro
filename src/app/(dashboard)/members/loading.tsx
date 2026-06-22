export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl w-full space-y-5">
      {/* Header card */}
      <div className="rounded-xl border border-hair px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg shimmer shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-5 w-20 rounded shimmer" />
          <div className="h-3.5 w-56 rounded shimmer" />
        </div>
      </div>
      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 0.9, 0.8, 0.7].map((op, i) => (
          <div key={i} className="rounded-xl border border-hair p-4 space-y-2" style={{ opacity: op }}>
            <div className="h-3 w-12 rounded shimmer" />
            <div className="h-7 w-8 rounded shimmer" />
          </div>
        ))}
      </div>
      {/* Members table */}
      <div className="rounded-xl border border-hair overflow-hidden">
        <div className="px-5 py-3 border-b border-hair flex items-center justify-between">
          <div className="h-4 w-28 rounded shimmer" />
          <div className="h-3.5 w-12 rounded shimmer" />
        </div>
        <div className="divide-y divide-hair">
          {[1, 0.85, 0.7, 0.55, 0.4, 0.28].map((op, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4" style={{ opacity: op }}>
              <div className="h-4 w-28 rounded shimmer" />
              <div className="h-4 flex-1 rounded shimmer" />
              <div className="h-5 w-12 rounded-full shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

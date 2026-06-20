export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between shrink-0">
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded shimmer" />
          <div className="h-3.5 w-48 rounded shimmer" />
        </div>
        <div className="h-9 w-32 rounded-lg shimmer" />
      </div>
      {/* Tab strip */}
      <div className="px-6 py-2.5 border-b border-hair flex items-center gap-1.5 shrink-0">
        {[60, 52].map((w, i) => (
          <div key={i} className="h-7 rounded-lg shimmer" style={{ width: w }} />
        ))}
      </div>
      {/* Checklist run cards */}
      <div className="flex-1 px-6 py-4 space-y-4">
        {[1, 0.75, 0.5].map((op, i) => (
          <div key={i} className="rounded-xl border border-hair overflow-hidden" style={{ opacity: op }}>
            <div className="px-4 py-3 border-b border-hair flex items-center justify-between">
              <div className="h-4 w-28 rounded shimmer" />
              <div className="h-6 w-16 rounded-full shimmer" />
            </div>
            {[1, 0.8, 0.6].map((rop, j) => (
              <div key={j} className="px-4 py-3 border-b border-hair last:border-0 flex items-center gap-3" style={{ opacity: rop }}>
                <div className="w-5 h-5 rounded shimmer shrink-0" />
                <div className="h-3.5 rounded shimmer flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

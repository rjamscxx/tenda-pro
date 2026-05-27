export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-hair shrink-0">
        <div className="space-y-2">
          <div className="h-6 w-20 rounded shimmer" />
          <div className="h-4 w-40 rounded shimmer" />
        </div>
        <div className="h-9 w-36 rounded-lg shimmer" />
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-hair flex gap-5 shrink-0">
        <div className="py-3"><div className="h-4 w-24 rounded shimmer" /></div>
        <div className="py-3"><div className="h-4 w-24 rounded shimmer" /></div>
      </div>

      {/* Table header */}
      <div className="px-6 py-3 border-b border-hair flex gap-6">
        {[120, 80, 80, 80, 60].map((w, i) => (
          <div key={i} className="h-3 rounded shimmer" style={{ width: w }} />
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 px-6 py-4 space-y-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-11 rounded-lg shimmer" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </div>
  )
}

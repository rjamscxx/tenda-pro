export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between shrink-0">
        <div className="h-5 w-32 rounded shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg shimmer" />
          <div className="h-8 w-24 rounded-lg shimmer" />
        </div>
      </div>
      {/* 3-column kanban */}
      <div className="flex-1 grid grid-cols-3 divide-x divide-hair min-h-0">
        {['New', 'Preparing', 'Ready'].map((col, ci) => (
          <div key={col} className="flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-hair flex items-center gap-2 shrink-0">
              <div className="h-4 rounded shimmer" style={{ width: ci === 0 ? 28 : ci === 1 ? 60 : 40 }} />
              <div className="h-4 w-5 rounded-full shimmer ml-auto" />
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-hidden">
              {[1, 0.7, ci < 2 ? 0.45 : 0].filter(Boolean).map((op, i) => (
                <div key={i} className="rounded-lg border border-hair p-3 space-y-2" style={{ opacity: op }}>
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-16 rounded shimmer" />
                    <div className="h-3 w-10 rounded shimmer" />
                  </div>
                  <div className="h-3 w-full rounded shimmer" />
                  <div className="h-3 w-2/3 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

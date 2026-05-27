export default function Loading() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left — dish browser */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-hair">
        {/* Top bar: search + channel */}
        <div className="px-4 py-3 border-b border-hair flex items-center gap-3 shrink-0">
          <div className="h-9 flex-1 rounded-lg shimmer" />
          <div className="flex gap-1.5 shrink-0">
            {[52, 60, 60, 44].map((w, i) => (
              <div key={i} className="h-8 rounded-lg shimmer" style={{ width: w, opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-4 border-b border-hair flex gap-2 shrink-0">
          {[64, 72, 56, 80, 60].map((w, i) => (
            <div key={i} className="my-2.5 h-7 rounded-lg shimmer" style={{ width: w, opacity: 1 - i * 0.12 }} />
          ))}
        </div>

        {/* Dish grid */}
        <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="rounded-xl shimmer" style={{ height: 88, opacity: 1 - i * 0.055 }} />
          ))}
        </div>
      </div>

      {/* Right — order panel */}
      <div className="w-72 lg:w-80 flex flex-col shrink-0 border-l border-hair">
        {/* Order header */}
        <div className="px-4 py-3 border-b border-hair flex items-center justify-between shrink-0">
          <div className="h-4 w-20 rounded shimmer" />
          <div className="h-7 w-16 rounded-lg shimmer" />
        </div>

        {/* Table / note inputs */}
        <div className="px-4 py-3 border-b border-hair space-y-2 shrink-0">
          <div className="h-9 w-full rounded-lg shimmer" />
          <div className="h-9 w-full rounded-lg shimmer opacity-70" />
        </div>

        {/* Order items */}
        <div className="flex-1 px-4 py-3 space-y-2.5 overflow-hidden">
          {[1, 0.85, 0.7, 0.55, 0.4].map((op, i) => (
            <div key={i} className="h-12 rounded-lg shimmer" style={{ opacity: op }} />
          ))}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-hair space-y-2 shrink-0">
          {[1, 0.8, 0.7].map((op, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3.5 w-20 rounded shimmer" style={{ opacity: op }} />
              <div className="h-3.5 w-16 rounded shimmer" style={{ opacity: op }} />
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <div className="h-5 w-12 rounded shimmer" />
            <div className="h-5 w-20 rounded shimmer" />
          </div>
        </div>

        {/* Charge button */}
        <div className="px-4 pb-4 shrink-0">
          <div className="h-11 w-full rounded-xl shimmer" />
        </div>
      </div>
    </div>
  )
}

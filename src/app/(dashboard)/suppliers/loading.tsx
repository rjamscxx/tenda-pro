export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between shrink-0">
        <div className="space-y-1.5">
          <div className="h-5 w-20 rounded shimmer" />
          <div className="h-3.5 w-44 rounded shimmer" />
        </div>
        <div className="h-9 w-32 rounded-lg shimmer" />
      </div>
      <div className="flex-1 px-6 py-4 space-y-3">
        {[1, 0.85, 0.7, 0.55, 0.4, 0.28].map((op, i) => (
          <div key={i} className="rounded-xl border border-hair p-4 flex items-start gap-3" style={{ opacity: op }}>
            <div className="w-9 h-9 rounded-lg shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded shimmer" />
              <div className="h-3 w-48 rounded shimmer" />
            </div>
            <div className="h-5 w-20 rounded-full shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

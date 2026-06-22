export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between shrink-0">
        <div className="space-y-1.5">
          <div className="h-5 w-16 rounded shimmer" />
          <div className="h-3.5 w-52 rounded shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-lg shimmer" />
          <div className="h-9 w-28 rounded-lg shimmer" />
        </div>
      </div>
      <div className="px-6 py-2.5 border-b border-hair flex items-center gap-1.5 shrink-0 flex-wrap">
        {[60, 72, 56, 68].map((w, i) => (
          <div key={i} className="h-7 rounded-lg shimmer" style={{ width: w }} />
        ))}
        <div className="ml-auto h-8 w-40 rounded-lg shimmer" />
      </div>
      <div className="flex-1 px-6 py-4 space-y-2.5">
        {[1, 0.85, 0.7, 0.55, 0.4, 0.28].map((op, i) => (
          <div key={i} className="h-11 rounded-lg shimmer" style={{ opacity: op }} />
        ))}
      </div>
    </div>
  )
}

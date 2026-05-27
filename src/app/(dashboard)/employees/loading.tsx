export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded shimmer" />
          <div className="h-3.5 w-56 rounded shimmer" />
        </div>
        <div className="h-9 w-32 rounded-lg shimmer" />
      </div>
      <div className="px-6 py-3 border-b border-hair flex gap-6">
        <div className="space-y-1"><div className="h-3 w-28 rounded shimmer" /><div className="h-6 w-8 rounded shimmer" /></div>
        <div className="space-y-1"><div className="h-3 w-32 rounded shimmer" /><div className="h-6 w-24 rounded shimmer" /></div>
      </div>
      <div className="flex-1 p-6 space-y-3">
        {[1, 0.85, 0.7, 0.55, 0.4, 0.28].map((op, i) => (
          <div key={i} className="h-14 rounded-lg shimmer" style={{ opacity: op }} />
        ))}
      </div>
    </div>
  )
}

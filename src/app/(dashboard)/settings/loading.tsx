export default function Loading() {
  return (
    <div className="p-6 max-w-2xl w-full space-y-6">
      <div className="space-y-1.5">
        <div className="h-6 w-20 rounded shimmer" />
        <div className="h-4 w-56 rounded shimmer" />
      </div>
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-16 rounded shimmer" />
          <div className="h-3.5 w-48 rounded shimmer" />
        </div>
        <div className="h-10 w-full rounded-lg shimmer" />
        <div className="h-10 w-full rounded-lg shimmer" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 rounded-lg shimmer" />
          <div className="h-10 rounded-lg shimmer" />
        </div>
        <div className="h-10 w-full rounded-lg shimmer opacity-70" />
        <div className="h-8 w-24 rounded-lg shimmer ml-auto" />
      </div>
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-16 rounded shimmer" />
          <div className="h-3.5 w-40 rounded shimmer" />
        </div>
        <div className="h-10 w-full rounded-lg shimmer" />
        <div className="h-10 w-full rounded-lg shimmer opacity-50" />
        <div className="h-8 w-24 rounded-lg shimmer ml-auto" />
      </div>
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="h-4 w-10 rounded shimmer" />
            <div className="h-3.5 w-44 rounded shimmer" />
          </div>
          <div className="h-6 w-16 rounded-full shimmer" />
        </div>
        <div className="h-28 w-full rounded-xl shimmer" />
      </div>
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-3.5 w-48 rounded shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl shimmer" style={{ opacity: 1 - i * 0.04 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

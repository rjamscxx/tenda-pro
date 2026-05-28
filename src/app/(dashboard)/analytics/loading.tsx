export default function AnalyticsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-surface-2 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-2 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-surface-2 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-56 bg-surface-2 rounded-xl" />
        <div className="h-56 bg-surface-2 rounded-xl" />
      </div>
    </div>
  )
}

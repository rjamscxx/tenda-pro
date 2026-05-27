export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-hair">
        <div className="h-5 w-16 rounded shimmer" />
        <div className="h-3.5 w-40 rounded shimmer mt-1.5" />
      </div>
      <div className="px-6 flex gap-6 border-b border-hair">
        <div className="h-10 w-28 rounded shimmer my-2" />
        <div className="h-10 w-32 rounded shimmer my-2" />
      </div>
      <div className="flex-1 p-6 space-y-3">
        {[1, 0.85, 0.7, 0.55, 0.4, 0.28].map((op, i) => (
          <div key={i} className="h-11 rounded-lg shimmer" style={{ opacity: op }} />
        ))}
      </div>
    </div>
  )
}

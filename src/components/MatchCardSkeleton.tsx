export function MatchCardSkeleton() {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="divide-y divide-border/40">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="skeleton size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-10 rounded" />
              <div className="skeleton h-2.5 w-24 rounded-full" />
            </div>
            <div className="skeleton size-8 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-7 w-20 rounded-lg" />
      </div>
    </article>
  )
}

/**
 * Skeleton for a single inline MetricCard. Mirrors the real card's dimensions
 * (rounded-2xl, p-3, icon row + value line) to avoid layout shift (CLS).
 */
export function MetricCardSkeleton() {
  return (
    <div className="relative flex items-start gap-2 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="skeleton size-3.5 shrink-0 rounded" />
          <div className="skeleton h-2.5 w-16 rounded-full" />
        </div>
        <div className="skeleton mt-2 h-5 w-20 rounded" />
      </div>
    </div>
  )
}

/** 2x2 grid of metric skeletons, matching the home metrics grid layout. */
export function MetricGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[0, 1, 2, 3].map((i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

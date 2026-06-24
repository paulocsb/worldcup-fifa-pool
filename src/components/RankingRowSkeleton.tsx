/**
 * Skeleton for a single ranking row. Mirrors the real row's layout
 * (position marker + 40px circular avatar + name bar + points bar) to avoid
 * layout shift (CLS). Wrap in the same <ol className="space-y-2"> as the list.
 */
export function RankingRowSkeleton() {
  return (
    <li>
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex w-6 shrink-0 justify-center">
          <div className="skeleton size-5 rounded-full" />
        </div>
        <div className="skeleton size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="skeleton h-7 w-10 rounded" />
        <div className="skeleton size-4 shrink-0 rounded" />
      </div>
    </li>
  )
}

/** List of ranking-row skeletons matching the real <ol> spacing. */
export function RankingListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ol className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <RankingRowSkeleton key={i} />
      ))}
    </ol>
  )
}

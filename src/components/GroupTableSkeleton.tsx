/**
 * Skeleton for a single group standings card. Mirrors the real GroupTable
 * (accent bar + GroupPill header + 4 table rows with circular flag + code +
 * number columns) to avoid layout shift (CLS). Uses the same rounded-2xl /
 * border / table-fixed structure as the live card.
 */
function GroupTableSkeleton() {
  return (
    <article
      aria-hidden
      className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1 bg-muted" />
      <header className="px-3 pt-2.5">
        <div className="skeleton h-6 w-24 rounded-full" />
      </header>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-6" />
          <col className="w-6" />
          <col className="w-6" />
          <col className="w-6" />
          <col className="hidden w-7 sm:table-column" />
          <col className="hidden w-7 sm:table-column" />
          <col className="w-8" />
          <col className="w-9" />
        </colgroup>
        <tbody>
          {Array.from({ length: 4 }, (_, i) => (
            <tr key={i} className={i > 0 ? 'border-t border-border/40' : ''}>
              <td className="py-2 pl-3 align-middle">
                <div className="mx-auto skeleton h-3 w-3 rounded" />
              </td>
              <td className="py-2 pl-1.5 align-middle">
                <div className="flex items-center gap-2">
                  <div className="skeleton size-[22px] shrink-0 rounded-full" />
                  <div className="skeleton h-3 w-12 rounded sm:w-20" />
                </div>
              </td>
              {Array.from({ length: 4 }, (_, c) => (
                <td key={c} className="py-2 align-middle">
                  <div className="mx-auto skeleton h-3 w-3 rounded" />
                </td>
              ))}
              <td className="hidden py-2 align-middle sm:table-cell">
                <div className="mx-auto skeleton h-3 w-3 rounded" />
              </td>
              <td className="hidden py-2 align-middle sm:table-cell">
                <div className="mx-auto skeleton h-3 w-3 rounded" />
              </td>
              <td className="py-2 align-middle">
                <div className="mx-auto skeleton h-3 w-4 rounded" />
              </td>
              <td className="py-2 pr-3 align-middle">
                <div className="mx-auto skeleton h-3.5 w-4 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

/** Grid of group-table skeletons matching the real standings grid layout. */
export function GroupStandingsSkeleton({ groups = 12 }: { groups?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: groups }, (_, i) => (
        <GroupTableSkeleton key={i} />
      ))}
    </div>
  )
}

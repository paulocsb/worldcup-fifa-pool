export function MatchCardSkeleton() {
  return (
    <article className="animate-float-in relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      {/* Header band neutro — espelha a faixa de cabeçalho colorida do card real
          (label à esquerda, status à direita) para evitar CLS. */}
      <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>

      {/* Scoreboard vertical: escudo 44px + código + nome por lado, centro. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-3">
        <SkeletonTeam />
        <div className="skeleton h-8 w-12 rounded" />
        <SkeletonTeam />
      </div>

      {/* Footer: botão de palpite full-width. */}
      <div className="mt-3 px-4 pb-4">
        <div className="skeleton h-11 w-full rounded-lg" />
      </div>
    </article>
  )
}

function SkeletonTeam() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="skeleton size-11 rounded-full" />
      <div className="skeleton h-4 w-10 rounded" />
      <div className="skeleton h-2.5 w-16 rounded-full" />
    </div>
  )
}

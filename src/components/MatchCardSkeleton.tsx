export function MatchCardSkeleton() {
  return (
    <article className="animate-float-in relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      {/* Header band neutro — contexto (data·local) à esquerda, pílula à direita. */}
      <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
        <div className="skeleton h-4 w-28 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>

      {/* Corpo HORIZONTAL: CÓDIGO + bandeira | caixa de horário | bandeira + CÓDIGO. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
        {/* Mandante — código + escudo, encostados no centro. */}
        <div className="flex items-center justify-end gap-2">
          <div className="skeleton h-5 w-10 rounded" />
          <div className="skeleton size-9 rounded-full" />
        </div>
        {/* Caixa de horário central. */}
        <div className="skeleton h-9 w-16 rounded-xl" />
        {/* Visitante — espelhado. */}
        <div className="flex items-center justify-start gap-2">
          <div className="skeleton size-9 rounded-full" />
          <div className="skeleton h-5 w-10 rounded" />
        </div>
      </div>

      {/* Footer: botão de palpite full-width. */}
      <div className="mt-3 px-4 pb-4">
        <div className="skeleton h-11 w-full rounded-lg" />
      </div>
    </article>
  )
}

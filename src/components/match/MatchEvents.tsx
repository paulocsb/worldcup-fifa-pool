import {
  Goal,
  RectangleVertical,
  ArrowLeftRight,
  Video,
} from 'lucide-react'
import type { ApiEvent } from '@/lib/apiFootballTypes'
import { cn } from '@/lib/utils'

function eventIcon(type: string, detail: string) {
  if (type === 'Goal') return <Goal className="size-4 text-emerald-500" />
  if (type === 'Card') {
    const isRed = /red/i.test(detail)
    return (
      <RectangleVertical
        className={cn(
          'size-4',
          isRed ? 'fill-destructive text-destructive' : 'fill-amber-400 text-amber-400',
        )}
      />
    )
  }
  if (type === 'subst')
    return <ArrowLeftRight className="size-4 text-muted-foreground" />
  if (type === 'Var') return <Video className="size-4 text-muted-foreground" />
  return null
}

export function MatchEvents({
  events,
  homeTeamId,
}: {
  events: ApiEvent[]
  homeTeamId: number | null
}) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem eventos registrados.
      </p>
    )
  }

  // Mais recente no topo: ordena descendente pelo minuto do jogo.
  const sorted = [...events].sort((a, b) => {
    const aMin = a.time.elapsed + (a.time.extra ?? 0) / 100
    const bMin = b.time.elapsed + (b.time.extra ?? 0) / 100
    return bMin - aMin
  })

  return (
    <ol className="relative space-y-1.5">
      {/* Linha vertical do timeline */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[26px] top-2 bottom-2 w-px bg-border/60"
      />

      {sorted.map((e, idx) => {
        const isHome = e.team.id === homeTeamId
        const minute = e.time.extra
          ? `${e.time.elapsed}+${e.time.extra}'`
          : `${e.time.elapsed}'`
        return (
          <li
            key={idx}
            className="relative flex items-center gap-3 rounded-lg px-1 py-1.5"
          >
            {/* Minute pill — linha do timeline */}
            <span className="font-display relative z-10 grid h-7 w-12 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-foreground">
              {minute}
            </span>

            {/* Icon (em cima da linha) */}
            <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-card ring-1 ring-border">
              {eventIcon(e.type, e.detail)}
            </span>

            {/* Conteúdo: nome + detalhe + nome do time small */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {e.player?.name ?? '—'}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[10px] font-medium uppercase tracking-wider',
                    isHome ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {e.team.name}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {e.detail}
                {e.assist?.name ? ` · assistência ${e.assist.name}` : ''}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

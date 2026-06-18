import type { Match } from '@/types/db'
import { cn } from '@/lib/utils'

function liveLabel(short: string | null, elapsed: number | null): string {
  if (short === 'HT' || short === 'INT' || short === 'BT') return 'Intervalo'
  if (short === 'P') return 'Pênaltis'
  if (short === 'SUSP') return 'Suspenso'
  if (elapsed != null) return `${elapsed}'`
  return 'Ao vivo'
}

/**
 * Indicador central do tempo de jogo no scoreboard da match-detail.
 *
 *  - LIVE: pílula vermelha pulsante com tempo (67'), intervalo, pênaltis, etc.
 *  - FINISHED: "FINAL" em destaque, indica encerramento.
 *  - SCHEDULED/CANCELLED: não renderiza nada (info já está no PageHeader).
 */
export function MatchTimer({
  match,
}: {
  match: Pick<Match, 'status' | 'elapsed_minutes' | 'live_status_short'>
}) {
  if (match.status === 'live') {
    const label = liveLabel(match.live_status_short, match.elapsed_minutes)
    const isMinute = /^\d+'$/.test(label)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
        <span className="relative inline-flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        <span className={cn(isMinute && 'font-display tabular-nums')}>
          {label}
        </span>
      </span>
    )
  }

  if (match.status === 'finished') {
    return (
      <span className="font-display inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        Final
      </span>
    )
  }

  return null
}

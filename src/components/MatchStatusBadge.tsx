import type { Match } from '@/types/db'
import { cn } from '@/lib/utils'
import { kickoffLabel } from '@/lib/format'

function liveLabel(short: string | null, elapsed: number | null): string {
  if (short === 'HT' || short === 'INT' || short === 'BT') return 'Intervalo'
  if (short === 'P') return 'Pênaltis'
  if (short === 'SUSP') return 'Suspenso'
  if (elapsed != null) return `${elapsed}'`
  return 'Ao vivo'
}

export function MatchStatusBadge({
  match,
}: {
  match: Pick<
    Match,
    | 'kickoff_at'
    | 'status'
    | 'group_letter'
    | 'stage'
    | 'elapsed_minutes'
    | 'live_status_short'
  >
}) {
  if (match.status === 'live') {
    const label = liveLabel(match.live_status_short, match.elapsed_minutes)
    const isMinute = /^\d+'$/.test(label)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
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
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Encerrado
      </span>
    )
  }
  if (match.status === 'cancelled') {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Cancelado
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {kickoffLabel(match.kickoff_at)}
    </span>
  )
}

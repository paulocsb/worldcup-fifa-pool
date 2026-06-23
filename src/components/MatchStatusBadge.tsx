import type { Match } from '@/types/db'
import { cn } from '@/lib/utils'
import { kickoffLabel } from '@/lib/format'

function liveLabel(
  short: string | null,
  elapsed: number | null,
  extra: number | null,
): string {
  if (short === 'HT' || short === 'INT' || short === 'BT') return 'Intervalo'
  if (short === 'P') return 'Pênaltis'
  if (short === 'SUSP') return 'Suspenso'
  if (elapsed != null) {
    return extra != null && extra > 0 ? `${elapsed}+${extra}'` : `${elapsed}'`
  }
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
    | 'elapsed_extra_minutes'
    | 'live_status_short'
  >
}) {
  if (match.status === 'live') {
    const label = liveLabel(
      match.live_status_short,
      match.elapsed_minutes,
      match.elapsed_extra_minutes,
    )
    const isMinute = /^\d+(\+\d+)?'$/.test(label)
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
  if (match.status === 'postponed') {
    // Mid-match suspension (SUSP) vs pre-kickoff postponement (PST):
    // both map to 'postponed' on the server. If we have a live_status_short
    // of SUSP, surface "Suspenso" — slightly different from generic "Adiado".
    const label = match.live_status_short === 'SUSP' ? 'Suspenso' : 'Adiado'
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-500">
        {label}
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

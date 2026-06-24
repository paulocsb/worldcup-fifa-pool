import { useTranslation } from 'react-i18next'
import type { Match } from '@/types/db'
import { cn } from '@/lib/utils'
import { kickoffLabel, timeOfDay } from '@/lib/format'

function useLiveLabel(): (
  short: string | null,
  elapsed: number | null,
  extra: number | null,
) => string {
  const { t } = useTranslation('matches')
  return (short, elapsed, extra) => {
    if (short === 'HT' || short === 'INT' || short === 'BT')
      return t('status.halftime')
    if (short === 'P') return t('status.penalties')
    if (short === 'SUSP') return t('status.suspended')
    if (elapsed != null) {
      return extra != null && extra > 0
        ? `${elapsed}+${extra}'`
        : `${elapsed}'`
    }
    return t('status.live')
  }
}

export function MatchStatusBadge({
  match,
  compactTime = false,
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
  /**
   * Quando a data já está num cabeçalho de seção (ex.: /matches agrupado por
   * dia), exibe só a hora (HH:mm) para partidas agendadas, evitando repetir
   * "Hoje, 16:00". Não afeta os estados ao vivo/encerrado.
   */
  compactTime?: boolean
}) {
  const { t } = useTranslation('matches')
  const liveLabel = useLiveLabel()

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
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
        {t('status.finished')}
      </span>
    )
  }
  if (match.status === 'postponed') {
    const label =
      match.live_status_short === 'SUSP'
        ? t('status.suspended')
        : t('status.postponed')
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-500">
        {label}
      </span>
    )
  }
  if (match.status === 'cancelled') {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {t('status.cancelled')}
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {compactTime ? timeOfDay(match.kickoff_at) : kickoffLabel(match.kickoff_at)}
    </span>
  )
}

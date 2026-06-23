import { useTranslation } from 'react-i18next'
import type { Match } from '@/types/db'
import { cn } from '@/lib/utils'

/**
 * Indicador central do tempo de jogo no scoreboard da match-detail.
 *
 *  - LIVE: pílula vermelha pulsante com tempo (67'), intervalo, pênaltis, etc.
 *  - FINISHED: "FINAL" em destaque, indica encerramento.
 *  - POSTPONED/SUSPENDED: pílula âmbar.
 *  - SCHEDULED/CANCELLED: não renderiza nada (info já está no PageHeader).
 */
export function MatchTimer({
  match,
}: {
  match: Pick<
    Match,
    | 'status'
    | 'elapsed_minutes'
    | 'elapsed_extra_minutes'
    | 'live_status_short'
  >
}) {
  const { t } = useTranslation('matches')

  if (match.status === 'live') {
    const short = match.live_status_short
    const elapsed = match.elapsed_minutes
    const extra = match.elapsed_extra_minutes
    const label =
      short === 'HT' || short === 'INT' || short === 'BT'
        ? t('status.halftime')
        : short === 'P'
          ? t('status.penalties')
          : short === 'SUSP'
            ? t('status.suspended')
            : elapsed != null
              ? extra != null && extra > 0
                ? `${elapsed}+${extra}'`
                : `${elapsed}'`
              : t('status.live')
    const isMinute = /^\d+(\+\d+)?'$/.test(label)
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
        {t('status.final')}
      </span>
    )
  }

  if (match.status === 'postponed') {
    const label =
      match.live_status_short === 'SUSP'
        ? t('status.suspended')
        : t('status.postponed')
    return (
      <span className="font-display inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-500">
        {label}
      </span>
    )
  }

  return null
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction, Score } from '@/types/db'
import { useScoringConfig } from '@/hooks/useScoringConfig'
import { kickoffLabel } from '@/lib/format'
import { TeamFlag } from './TeamFlag'
import { GroupPill } from './GroupPill'
import { PhasePill } from './PhasePill'
import { PredictionScoreBadge } from './PredictionScoreBadge'
import { cn } from '@/lib/utils'

interface Props {
  match: MatchWithTeams
  prediction: Prediction
  score: Score | null
}

/**
 * Card da tela /me/predictions. O placar do PALPITE é o protagonista (centro,
 * grande); o resultado real aparece logo abaixo em estilo discreto.
 *
 * Estados visuais (priority order):
 *   - ao vivo: borda vermelha + pill pulsante "ao vivo"
 *   - exato: borda gold + coroa + palpite em gold
 *   - resultado certo (>0 pts): "+N pts" em primary
 *   - 0 pts: muted
 *   - finished pré-cutoff (ex: MD1): tag "Não pontua" — palpite registrado,
 *     mas não contabiliza pontos por regra de equidade
 *   - aguardando: pill "aguardando" no topo, sem linha de resultado
 *
 * Click → match-detail.
 */
export function MyPredictionRow({ match, prediction, score }: Props) {
  const scoring = useScoringConfig()
  const cutoffMatchday = scoring.data?.group_matchday_start ?? 2
  const { t } = useTranslation('matches')

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const isPostponed = match.status === 'postponed'
  const showRealScore = isFinished || isLive
  const points = score?.points ?? null
  const isExact =
    isFinished &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  // Matches da fase de grupos antes do cutoff (ex: MD1) não pontuam por design
  const matchdayPreCutoff =
    match.stage === 'group' &&
    (match.matchday ?? 1) < cutoffMatchday
  const isFinishedNotScoring = isFinished && points === null && matchdayPreCutoff

  return (
    <Link
      to={`/matches/${match.id}`}
      className={cn(
        'block rounded-xl border bg-card/80 p-3 transition-colors active:scale-[0.99]',
        // Prioridade visual: exact > live > normal
        isExact
          ? 'border-gold/60 bg-gold/[0.06] hover:border-gold'
          : isLive
            ? 'border-destructive/50 bg-destructive/[0.04] hover:border-destructive/70'
            : 'border-border/60 hover:border-border',
      )}
    >
      {/* Header: pill de contexto + indicador de estado/pontos */}
      <div className="mb-2.5 flex items-center justify-between">
        {match.group_letter ? (
          <GroupPill letter={match.group_letter} size="sm" withLabel />
        ) : (
          <PhasePill stage={match.stage} size="sm" variant="tinted" />
        )}
        <StatusIndicator
          score={score}
          isExact={isExact}
          isLive={isLive}
          isPostponed={isPostponed}
          postponedShort={match.live_status_short}
          isFinishedNotScoring={isFinishedNotScoring}
        />
      </div>

      {/* Scoreboard — PALPITE é o protagonista no centro */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="font-display truncate text-base font-bold uppercase tracking-tight">
            {match.home_team?.code ?? '—'}
          </span>
          <TeamFlag team={match.home_team} size={28} />
        </div>

        <div className="px-1 text-center">
          <span
            className={cn(
              'font-display text-2xl font-black leading-none tabular-nums',
              isExact && 'text-gold',
            )}
          >
            {prediction.home_score}
            <span className="mx-1 text-muted-foreground/50">–</span>
            {prediction.away_score}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag team={match.away_team} size={28} />
          <span className="font-display truncate text-base font-bold uppercase tracking-tight">
            {match.away_team?.code ?? '—'}
          </span>
        </div>
      </div>

      {/* Sub-linha abaixo do palpite (mesmo espaço, 3 cenários):
            1. Live ou finalizada → "Parcial/Resultado X-Y"
            2. Postponed → "Aguardando nova data" ou "Suspenso no minuto N"
            3. Scheduled → "Início [data/hora]" */}
      {showRealScore ? (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider">
            {isLive ? t('partial') : t('result')}
          </span>{' '}
          <span
            className={cn(
              'font-display font-bold tabular-nums',
              isLive
                ? 'text-destructive'
                : isExact
                  ? 'text-gold'
                  : 'text-foreground/70',
            )}
          >
            {match.home_score ?? '-'}–{match.away_score ?? '-'}
          </span>
        </p>
      ) : isPostponed ? (
        <p className="mt-2 text-center text-[11px] text-amber-500">
          {match.live_status_short === 'SUSP'
            ? t('suspendedWaiting')
            : t('postponedWaitingDate')}
        </p>
      ) : (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider">{t('startsAt')}</span>{' '}
          <span className="font-medium text-foreground/70">
            {kickoffLabel(match.kickoff_at)}
          </span>
        </p>
      )}
    </Link>
  )
}

function StatusIndicator({
  score,
  isExact,
  isLive,
  isPostponed,
  postponedShort,
  isFinishedNotScoring,
}: {
  score: Score | null
  isExact: boolean
  isLive: boolean
  isPostponed: boolean
  postponedShort: string | null
  isFinishedNotScoring: boolean
}) {
  const { t } = useTranslation('matches')
  // Ordem de prioridade: ao vivo > adiado/suspenso > pontos > não pontua > aguardando
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
        <span className="relative inline-flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
        {t('myPrediction.live')}
      </span>
    )
  }
  if (isPostponed) {
    const label =
      postponedShort === 'SUSP'
        ? t('status.suspended')
        : t('status.postponed')
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
        {label}
      </span>
    )
  }
  if (score !== null) {
    return <PredictionScoreBadge score={score} isExact={isExact} />
  }
  if (isFinishedNotScoring) {
    return (
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t('myPrediction.noScoring')}
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {t('myPrediction.waiting')}
    </span>
  )
}

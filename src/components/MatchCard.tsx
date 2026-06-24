import { Link } from 'react-router-dom'
import { Clock, Lock, MapPin, Pencil, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction, Score, Team } from '@/types/db'
import { isPredictionOpen, lockTime } from '@/lib/matchLock'
import { groupColorToken, phaseColorToken } from '@/lib/groupColors'
import { useTeamName } from '@/lib/teamI18n'
import { venueLabel } from '@/lib/venueCountry'
import { kickoffLabel, timeUntil } from '@/lib/format'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import { TeamFlag } from './TeamFlag'
import { MatchStatusBadge } from './MatchStatusBadge'
import { AnimatedScore } from './AnimatedScore'
import { GroupPill } from './GroupPill'
import { PhasePill } from './PhasePill'
import { PredictionScoreBadge } from './PredictionScoreBadge'

interface MatchCardProps {
  match: MatchWithTeams
  prediction?: Prediction
  /**
   * Score do palpite do usuário nesta partida (já computado pelo servidor).
   * Quando presente e a partida está encerrada, exibe "+N pts" + coroa de
   * placar exato no footer — fecha o loop emocional no próprio feed.
   */
  score?: Score | null
  onPredict?: (match: MatchWithTeams) => void
  /**
   * Em telas que já agrupam jogos por dia (ex.: /matches), o badge exibe só a
   * hora (HH:mm) em vez de "Hoje, 16:00", evitando redundância com o header.
   */
  compactTime?: boolean
}

function TeamRow({
  team,
  score,
  showScore,
  isWinner,
  isLive,
}: {
  team: Team | null
  score: number | null | undefined
  showScore: boolean
  isWinner: boolean
  isLive: boolean
}) {
  const teamName = useTeamName(team)
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2',
        showScore && !isWinner && 'opacity-70',
      )}
    >
      <TeamFlag team={team} size={40} />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'font-display text-lg font-black uppercase leading-tight tracking-tight',
            isWinner && 'text-foreground',
          )}
        >
          {team?.code ?? '—'}
        </div>
        {/* Nome completo só em jogos agendados: dá respiro ao placar quando
            ao vivo/encerrado, onde o placar é o foco. */}
        {team && !showScore && (
          <div className="truncate text-[11px] leading-tight text-muted-foreground">
            {teamName}
          </div>
        )}
      </div>
      <span
        className={cn(
          'shrink-0 font-display text-4xl font-bold leading-none',
          !showScore && 'text-muted-foreground/30',
          isWinner && 'text-primary',
        )}
        aria-hidden={!showScore}
      >
        {showScore ? (
          <AnimatedScore value={score ?? 0} flash={isLive} />
        ) : (
          <span className="tabular-nums">—</span>
        )}
      </span>
    </div>
  )
}

export function MatchCard({
  match,
  prediction,
  score,
  onPredict,
  compactTime = false,
}: MatchCardProps) {
  const { t } = useTranslation('matches')

  // Countdown do lock: ativamos o relógio compartilhado só nos cards na janela
  // de <60min até o lock (kickoff − 5min). Fora dela, useNow(false) não se
  // inscreve no tick — sem custo de re-render.
  const lockAt = lockTime(match)
  const COUNTDOWN_WINDOW_MS = 60 * 60_000
  const inCountdownWindow =
    match.status === 'scheduled' &&
    lockAt.getTime() - Date.now() < COUNTDOWN_WINDOW_MS
  const now = useNow(inCountdownWindow)

  // `open` re-avaliado contra o `now` reativo: quando o card está na janela e o
  // lock cruza, o footer transiciona de countdown → "Encerrado" sem reload.
  const open = isPredictionOpen(match, new Date(now))
  const msToLock = lockAt.getTime() - now
  const showCountdown = inCountdownWindow && open && msToLock > 0
  const showScore = match.status === 'finished' || match.status === 'live'
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  // Placar exato: palpite === resultado real (mesma regra da MyPredictionRow).
  const isExact =
    isFinished &&
    !!prediction &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  const showScoreBadge = isFinished && !!score && !!prediction

  const homeName = useTeamName(match.home_team)
  const awayName = useTeamName(match.away_team)
  // Descritor curto para leitores de tela: "ao vivo", "encerrado" ou horário.
  const statusDescriptor =
    match.status === 'live'
      ? t('status.live').toLowerCase()
      : match.status === 'finished'
        ? t('status.finished').toLowerCase()
        : kickoffLabel(match.kickoff_at)
  const ariaLabel = t('cardAria', {
    home: homeName,
    away: awayName,
    status: statusDescriptor,
  })

  // Token de cor dominante do card: cor do grupo se for fase de grupos,
  // senão a cor da fase. A faixa lateral SEMPRE reflete grupo/fase; o sinal
  // de "ao vivo" fica só no badge pulsante.
  const accentToken =
    match.stage === 'group'
      ? groupColorToken(match.group_letter)
      : phaseColorToken(match.stage)
  const accentStyle = accentToken
    ? ({ '--accent-c': `hsl(var(--${accentToken}))` } as React.CSSProperties)
    : undefined

  const homeScore = match.home_score ?? 0
  const awayScore = match.away_score ?? 0
  const homeWins = showScore && homeScore > awayScore
  const awayWins = showScore && awayScore > homeScore

  return (
    <article
      style={accentStyle}
      className={cn(
        'animate-float-in relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        !isLive && 'hover:[border-color:var(--accent-c)]/60',
      )}
    >
      {/* Faixa de cor lateral esquerda — identifica grupo/fase visualmente.
          Reflete sempre grupo/fase, inclusive ao vivo (o sinal de "ao vivo"
          fica apenas no badge pulsante). */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-1',
          accentStyle && '[background-color:var(--accent-c)]',
        )}
      />

      <Link
        to={`/matches/${match.id}`}
        className="block"
        aria-label={ariaLabel}
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          {match.group_letter ? (
            <GroupPill letter={match.group_letter} size="md" withLabel />
          ) : (
            <PhasePill stage={match.stage} size="md" variant="solid" />
          )}
          <MatchStatusBadge match={match} compactTime={compactTime} />
        </header>

        <div className="divide-y divide-border/40">
          <TeamRow
            team={match.home_team}
            score={match.home_score}
            showScore={showScore}
            isWinner={homeWins}
            isLive={isLive}
          />
          <TeamRow
            team={match.away_team}
            score={match.away_score}
            showScore={showScore}
            isWinner={awayWins}
            isLive={isLive}
          />
        </div>
      </Link>

      <footer className="mt-3 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between gap-2">
        {prediction ? (
          <span className="flex items-center gap-1.5 text-xs">
            <Trophy className="size-3 text-gold" />
            <span className="text-muted-foreground">
              {t('prediction.label')}:
            </span>
            <span className="font-display font-semibold tabular-nums">
              {prediction.home_score}–{prediction.away_score}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {open ? t('prediction.none') : t('prediction.noneLocked')}
          </span>
        )}
        {showScoreBadge && score ? (
          <PredictionScoreBadge score={score} isExact={isExact} />
        ) : (
        <button
          type="button"
          onClick={() => onPredict?.(match)}
          disabled={!open || !onPredict}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors',
            open
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {open ? (
            <>
              <Pencil className="size-3" />
              {prediction ? t('prediction.edit') : t('prediction.predict')}
            </>
          ) : (
            <>
              <Lock className="size-3" />
              {t('prediction.closed')}
            </>
          )}
        </button>
        )}
        </div>

        {/* Countdown do lock: aviso âmbar acionável quando falta <60min para o
            palpite fechar. Âmbar (warning), nunca vermelho — vermelho é
            reservado ao "ao vivo". aria-live: anunciado a leitores de tela. */}
        {showCountdown && (
          <p
            aria-live="polite"
            className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400"
          >
            <Clock className="size-3 shrink-0" aria-hidden />
            <span>
              {t('prediction.closesIn', {
                time: timeUntil(lockAt, { unit: 'minute' }),
              })}
            </span>
          </p>
        )}

        {/* Estádio rebaixado a info terciária: só em jogos agendados, onde o
            placar ainda não disputa a hierarquia visual. */}
        {!showScore && (match.venue || match.venue_city) && (
          <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {venueLabel(match.venue, match.venue_city)}
            </span>
          </p>
        )}
      </footer>
    </article>
  )
}

import { Link } from 'react-router-dom'
import { Lock, Pencil, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction, Team } from '@/types/db'
import { isPredictionOpen } from '@/lib/matchLock'
import { groupColorToken, phaseColorToken } from '@/lib/groupColors'
import { venueLabel } from '@/lib/venueCountry'
import { cn } from '@/lib/utils'
import { TeamFlag } from './TeamFlag'
import { MatchStatusBadge } from './MatchStatusBadge'
import { AnimatedScore } from './AnimatedScore'
import { GroupPill } from './GroupPill'
import { PhasePill } from './PhasePill'

interface MatchCardProps {
  match: MatchWithTeams
  prediction?: Prediction
  onPredict?: (match: MatchWithTeams) => void
}

function TeamRow({
  team,
  score,
  showScore,
  isWinner,
}: {
  team: Team | null
  score: number | null | undefined
  showScore: boolean
  isWinner: boolean
}) {
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
        {team?.name && (
          <div className="truncate text-[11px] leading-tight text-muted-foreground">
            {team.name}
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
          <AnimatedScore value={score ?? 0} />
        ) : (
          <span className="tabular-nums">—</span>
        )}
      </span>
    </div>
  )
}

export function MatchCard({ match, prediction, onPredict }: MatchCardProps) {
  const { t } = useTranslation('matches')
  const open = isPredictionOpen(match)
  const showScore = match.status === 'finished' || match.status === 'live'
  const isLive = match.status === 'live'

  // Token de cor dominante do card: cor do grupo se for fase de grupos,
  // senão a cor da fase. Live sobrescreve com destructive.
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
        'animate-float-in relative overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        isLive
          ? 'border-destructive/50'
          : 'border-border/60 hover:[border-color:var(--accent-c)]/60',
      )}
    >
      {/* Faixa de cor lateral esquerda — identifica grupo/fase visualmente.
          Quando live, fica vermelha. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-1',
          isLive
            ? 'bg-destructive'
            : accentStyle && '[background-color:var(--accent-c)]',
        )}
      />

      <Link to={`/matches/${match.id}`} className="block">
        <header className="mb-3 flex items-center justify-between gap-2">
          {match.group_letter ? (
            <GroupPill letter={match.group_letter} size="md" withLabel />
          ) : (
            <PhasePill stage={match.stage} size="md" variant="solid" />
          )}
          <MatchStatusBadge match={match} />
        </header>

        {(match.venue || match.venue_city) && (
          <div className="mb-2 truncate text-[11px] text-muted-foreground">
            {venueLabel(match.venue, match.venue_city)}
          </div>
        )}

        <div className="divide-y divide-border/40">
          <TeamRow
            team={match.home_team}
            score={match.home_score}
            showScore={showScore}
            isWinner={homeWins}
          />
          <TeamRow
            team={match.away_team}
            score={match.away_score}
            showScore={showScore}
            isWinner={awayWins}
          />
        </div>
      </Link>

      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
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
        <button
          type="button"
          onClick={() => onPredict?.(match)}
          disabled={!open || !onPredict}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
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
      </footer>
    </article>
  )
}

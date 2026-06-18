import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction, Score } from '@/types/db'
import { TeamFlag } from './TeamFlag'
import { GroupPill } from './GroupPill'
import { PhasePill } from './PhasePill'
import { cn } from '@/lib/utils'

interface Props {
  match: MatchWithTeams
  prediction: Prediction
  score: Score | null
}

/**
 * Card da tela /me/predictions. O placar do PALPITE é o protagonista (centro,
 * grande); o resultado real aparece logo abaixo em estilo discreto. Estados:
 *
 *   - exato: borda gold + coroa + palpite em gold (resultado escondido — é igual)
 *   - resultado certo (>0 pts): "+N pts" em primary
 *   - 0 pts: muted
 *   - aguardando: pill "aguardando" no topo, sem linha de resultado
 *   - ao vivo: pill "ao vivo" pulsante; linha mostra "Parcial X–Y"
 *
 * Click → match-detail.
 */
export function MyPredictionRow({ match, prediction, score }: Props) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const showRealScore = isFinished || isLive
  const points = score?.points ?? null
  const isExact =
    isFinished &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  const earned = points !== null && points > 0

  return (
    <Link
      to={`/matches/${match.id}`}
      className={cn(
        'block rounded-xl border bg-card/80 p-3 transition-colors active:scale-[0.99]',
        isExact
          ? 'border-gold/60 bg-gold/[0.06] hover:border-gold'
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
          points={points}
          earned={earned}
          isExact={isExact}
          isLive={isLive}
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

      {/* Resultado real abaixo, discreto. Escondido quando exato (redundante)
          ou quando partida ainda não rolou */}
      {showRealScore && !isExact && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider">
            {isLive ? 'Parcial' : 'Resultado'}
          </span>{' '}
          <span className="font-display font-bold tabular-nums text-foreground/70">
            {match.home_score ?? '-'}–{match.away_score ?? '-'}
          </span>
        </p>
      )}
    </Link>
  )
}

function StatusIndicator({
  points,
  earned,
  isExact,
  isLive,
}: {
  points: number | null
  earned: boolean
  isExact: boolean
  isLive: boolean
}) {
  if (points !== null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-display text-sm font-bold tabular-nums',
          isExact && 'text-gold',
          earned && !isExact && 'text-primary',
          !earned && 'text-muted-foreground',
        )}
      >
        {isExact && <Crown className="size-3.5" />}
        {earned ? '+' : ''}
        {points} pt{points === 1 ? '' : 's'}
      </span>
    )
  }
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <span className="relative inline-flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
        Ao vivo
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      Aguardando
    </span>
  )
}

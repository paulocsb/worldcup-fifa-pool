import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface Props {
  /**
   * Pontos já computados pelo servidor, ou `null` quando o palpite ainda não
   * foi pontuado (partida/grupo/torneio em aberto). Em `null` renderiza o
   * estado "aguardando" — assim este badge cobre TODOS os estados de pontuação
   * de palpite (partida, grupo e torneio).
   */
  points: number | null
  /**
   * Placar exato (palpite === resultado real). Renderiza coroa + cor gold.
   * Calculado pelo chamador a partir de prediction vs match. Default false
   * (grupo/torneio não têm "exato").
   */
  isExact?: boolean
  className?: string
}

/**
 * Badge de pontuação de um palpite: "+N pts" (acertou), "N pts" (zero),
 * "aguardando" (ainda não pontuado), com destaque gold + coroa quando o palpite
 * de partida foi exato.
 *
 * Fonte única de verdade visual para pontos de palpite — consumido pela
 * MyPredictionRow e cards de grupo/torneio (/me/predictions) e pelo footer do
 * MatchCard (/home, /matches). NÃO calcula pontos: apenas exibe `points` já
 * computado pelo servidor.
 */
export function PredictionScoreBadge({
  points,
  isExact = false,
  className,
}: Props) {
  const { t } = useTranslation('matches')
  if (points === null) {
    return (
      <span
        className={cn(
          'font-display text-sm font-bold lowercase text-muted-foreground',
          className,
        )}
      >
        {t('myPrediction.waiting').toLowerCase()}
      </span>
    )
  }
  const earned = points > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-display text-sm font-bold tabular-nums',
        // Exato: texto + coroa em gold (preferência de design). Acertou resultado:
        // primary (verde). Zero: muted.
        isExact ? 'text-gold' : earned ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      {isExact && <Crown className="size-3.5 text-gold" aria-hidden />}
      {earned
        ? t('myPrediction.earnedPoints', { count: points })
        : t('myPrediction.zeroPoints', { count: points })}
    </span>
  )
}

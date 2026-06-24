import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Score } from '@/types/db'
import { cn } from '@/lib/utils'

interface Props {
  score: Score
  /**
   * Placar exato (palpite === resultado real). Renderiza coroa + cor gold.
   * Calculado pelo chamador a partir de prediction vs match, pois não está
   * armazenado no Score.
   */
  isExact: boolean
  className?: string
}

/**
 * Badge de pontuação de um palpite de partida: "+N pts" (resultado certo) ou
 * "N pts" (zero), com destaque gold + coroa quando o palpite foi exato.
 *
 * Fonte única de verdade visual para pontos de palpite — consumido tanto pela
 * MyPredictionRow (/me/predictions) quanto pelo footer do MatchCard (/home,
 * /matches). NÃO calcula pontos: apenas exibe `score.points` já computado pelo
 * servidor.
 */
export function PredictionScoreBadge({ score, isExact, className }: Props) {
  const { t } = useTranslation('matches')
  const points = score.points
  const earned = points > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-display text-sm font-bold tabular-nums',
        isExact && 'text-gold',
        earned && !isExact && 'text-primary',
        !earned && 'text-muted-foreground',
        className,
      )}
    >
      {isExact && <Crown className="size-3.5" aria-hidden />}
      {earned
        ? t('myPrediction.earnedPoints', { count: points })
        : t('myPrediction.zeroPoints', { count: points })}
    </span>
  )
}

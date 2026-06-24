import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DEFAULT_SCORING } from '@/lib/scoring'

export interface UserStats {
  total_predictions: number
  scored_predictions: number
  pointed_predictions: number
  total_points: number
  best_score: number
  exact_scores: number
  accuracy: number
}

/**
 * Stats agregadas do usuário para o card do Profile.
 * Queries diretas em predictions + scores; pequeno volume, OK em runtime.
 */
export function useUserStats(userId: string | undefined) {
  return useQuery<UserStats>({
    queryKey: ['user-stats', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) {
        return {
          total_predictions: 0,
          scored_predictions: 0,
          pointed_predictions: 0,
          total_points: 0,
          best_score: 0,
          exact_scores: 0,
          accuracy: 0,
        }
      }

      // Total de palpites
      const { count: totalPreds } = await supabase
        .from('predictions')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)

      // Scores do usuário
      const { data: scores, error: scoresErr } = await supabase
        .from('scores')
        .select('points, breakdown')
        .eq('user_id', userId)
        .eq('source', 'match')
      if (scoresErr) throw scoresErr

      const scoredPredictions = scores?.length ?? 0
      const totalPoints = (scores ?? []).reduce((sum, s) => sum + (s.points ?? 0), 0)
      const bestScore = (scores ?? []).reduce(
        (max, s) => Math.max(max, s.points ?? 0),
        0,
      )
      const exactScores = (scores ?? []).filter((s) => {
        const breakdown = s.breakdown as { exact?: number } | null
        return (breakdown?.exact ?? 0) > 0
      }).length
      const pointedPredictions = (scores ?? []).filter(
        (s) => (s.points ?? 0) > 0,
      ).length
      const maxPointsPerMatch = DEFAULT_SCORING.match.exact_score
      const accuracy =
        scoredPredictions > 0
          ? Math.round(
              (totalPoints / (scoredPredictions * maxPointsPerMatch)) * 100,
            )
          : 0

      return {
        total_predictions: totalPreds ?? 0,
        scored_predictions: scoredPredictions,
        pointed_predictions: pointedPredictions,
        total_points: totalPoints,
        best_score: bestScore,
        exact_scores: exactScores,
        accuracy,
      }
    },
  })
}

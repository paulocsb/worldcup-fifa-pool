import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ScoringConfig {
  match: {
    exact_score: number
    correct_result: number
    correct_goal_diff_bonus: number
  }
  group: {
    first: number
    second: number
    third: number
    fourth: number
    qualifier_bonus_per_team: number
  }
  tournament: {
    champion: number
    runner_up: number
    third_place: number
  }
  lock_minutes: number
  scoring_start_at: string | null
  /** Matchday a partir do qual jogos de grupo pontuam (default 2: pula MD1) */
  group_matchday_start: number
}

const DEFAULT_CONFIG: ScoringConfig = {
  match: { exact_score: 10, correct_result: 5, correct_goal_diff_bonus: 2 },
  group: {
    first: 5,
    second: 5,
    third: 3,
    fourth: 2,
    qualifier_bonus_per_team: 3,
  },
  tournament: { champion: 30, runner_up: 15, third_place: 10 },
  lock_minutes: 5,
  scoring_start_at: null,
  group_matchday_start: 2,
}

/**
 * Lê todos os valores de scoring_config do DB e agrega num objeto único.
 * Cache: 5 min (mudanças são raras).
 */
export function useScoringConfig() {
  return useQuery<ScoringConfig>({
    queryKey: ['scoring-config'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_config')
        .select('key, value')
      if (error) throw error

      const map = new Map<string, unknown>(
        (data ?? []).map((r) => [r.key, r.value]),
      )
      return {
        match: (map.get('match') as ScoringConfig['match']) ?? DEFAULT_CONFIG.match,
        group: (map.get('group') as ScoringConfig['group']) ?? DEFAULT_CONFIG.group,
        tournament:
          (map.get('tournament') as ScoringConfig['tournament']) ??
          DEFAULT_CONFIG.tournament,
        lock_minutes:
          (map.get('lock_minutes') as number) ?? DEFAULT_CONFIG.lock_minutes,
        scoring_start_at: (map.get('scoring_start_at') as string) ?? null,
        group_matchday_start:
          (map.get('group_matchday_start') as number) ??
          DEFAULT_CONFIG.group_matchday_start,
      }
    },
  })
}

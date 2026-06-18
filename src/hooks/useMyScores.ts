import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Score } from '@/types/db'

export interface MyScoresIndex {
  /** key: match_id */
  byMatch: Map<number, Score>
  /** key: group_letter */
  byGroup: Map<string, Score>
  tournament: Score | null
  total: number
}

/**
 * Retorna todos os scores do usuário, já indexados por source. Permite lookup
 * O(1) por match_id ou group_letter. Usado na tela /me/predictions.
 */
export function useMyScores(userId: string | undefined) {
  return useQuery<MyScoresIndex>({
    queryKey: ['my-scores', userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async () => {
      const empty: MyScoresIndex = {
        byMatch: new Map(),
        byGroup: new Map(),
        tournament: null,
        total: 0,
      }
      if (!userId) return empty
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error

      const index: MyScoresIndex = {
        byMatch: new Map(),
        byGroup: new Map(),
        tournament: null,
        total: 0,
      }
      for (const s of (data ?? []) as Score[]) {
        index.total += s.points ?? 0
        if (s.source === 'match' && s.match_id != null) {
          index.byMatch.set(s.match_id, s)
        } else if (s.source === 'group' && s.group_letter) {
          index.byGroup.set(s.group_letter, s)
        } else if (s.source === 'tournament') {
          index.tournament = s
        }
      }
      return index
    },
  })
}

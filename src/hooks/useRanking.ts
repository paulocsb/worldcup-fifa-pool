import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Row exposed by `useRanking`. Extends the raw `user_total_scores` view with
 * client-aggregated tiebreaker fields (`exact_count`, `scored_count`)
 * computed from `scores`. Order is determined by:
 *
 *   1. total_points DESC          (main metric)
 *   2. exact_count DESC           (most cravados — precision)
 *   3. scored_count DESC          (most scored matches — engagement)
 *   4. display_name ASC (pt-BR)   (deterministic fallback)
 */
export interface RankingRow {
  user_id: string
  display_name: string | null
  avatar_seed: string | null
  avatar_style: string | null
  total_points: number
  exact_count: number
  scored_count: number
}

export function useRanking() {
  return useQuery<RankingRow[]>({
    queryKey: ['ranking'],
    staleTime: 60_000,
    queryFn: async () => {
      const [totalsRes, scoresRes] = await Promise.all([
        supabase.from('user_total_scores').select('*'),
        supabase
          .from('scores')
          .select('user_id, breakdown')
          .eq('source', 'match'),
      ])

      if (totalsRes.error) throw totalsRes.error
      if (scoresRes.error) throw scoresRes.error

      // Aggregate per user: count exact-score predictions + total scored matches.
      const agg = new Map<string, { exact: number; scored: number }>()
      for (const s of scoresRes.data ?? []) {
        if (!s.user_id) continue
        const breakdown = s.breakdown as { exact?: number } | null
        const cur = agg.get(s.user_id) ?? { exact: 0, scored: 0 }
        cur.scored += 1
        if ((breakdown?.exact ?? 0) > 0) cur.exact += 1
        agg.set(s.user_id, cur)
      }

      const rows: RankingRow[] = (totalsRes.data ?? [])
        .filter((row) => row.user_id !== null)
        .map((row) => {
          const a = agg.get(row.user_id as string) ?? { exact: 0, scored: 0 }
          return {
            user_id: row.user_id as string,
            display_name: row.display_name,
            avatar_seed: row.avatar_seed,
            avatar_style: row.avatar_style,
            total_points: row.total_points ?? 0,
            exact_count: a.exact,
            scored_count: a.scored,
          }
        })

      rows.sort((a, b) => {
        if (b.total_points !== a.total_points)
          return b.total_points - a.total_points
        if (b.exact_count !== a.exact_count) return b.exact_count - a.exact_count
        if (b.scored_count !== a.scored_count)
          return b.scored_count - a.scored_count
        return (a.display_name ?? '').localeCompare(
          b.display_name ?? '',
          'pt-BR',
        )
      })

      return rows
    },
  })
}

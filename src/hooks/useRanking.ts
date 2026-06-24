import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Row exposed by `useRanking`. Extends the raw `user_total_scores` view with
 * client-aggregated tiebreaker fields (`exact_count`, `scored_count`)
 * computed from `scores`. Order is determined by `compareRanking`:
 *
 *   1. total_points DESC          (main metric)
 *   2. exact_count DESC           (most cravados — precision)
 *   3. scored_count DESC          (most scored matches — engagement)
 *   4. display_name ASC (pt-BR)   (deterministic fallback)
 *
 * `previous_position` / `delta` encode the position movement since the last
 * scoring run that actually changed something (see `ranking_snapshot`).
 */
export interface RankingRow {
  user_id: string
  display_name: string | null
  avatar_seed: string | null
  avatar_style: string | null
  total_points: number
  exact_count: number
  scored_count: number
  /** 1-based position in the previous snapshot, or null if the user is new. */
  previous_position: number | null
  /** previous_position - current_position. >0 up, <0 down, 0 same, null new. */
  delta: number | null
}

/** Fields the ranking sort depends on. */
type Rankable = Pick<
  RankingRow,
  'total_points' | 'exact_count' | 'scored_count' | 'display_name'
>

/**
 * Canonical ranking comparator. Used for BOTH the current ranking and the
 * previous snapshot so the displayed position and the computed delta can never
 * diverge.
 */
export function compareRanking(a: Rankable, b: Rankable): number {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points
  if (b.exact_count !== a.exact_count) return b.exact_count - a.exact_count
  if (b.scored_count !== a.scored_count) return b.scored_count - a.scored_count
  return (a.display_name ?? '').localeCompare(b.display_name ?? '', 'pt-BR')
}

export function useRanking() {
  return useQuery<RankingRow[]>({
    queryKey: ['ranking'],
    staleTime: 60_000,
    queryFn: async () => {
      const [totalsRes, scoresRes, snapshotRes] = await Promise.all([
        supabase.from('user_total_scores').select('*'),
        supabase
          .from('scores')
          .select('user_id, breakdown')
          .eq('source', 'match'),
        supabase
          .from('ranking_snapshot')
          .select('user_id, total_points, exact_count, scored_count'),
      ])

      if (totalsRes.error) throw totalsRes.error
      if (scoresRes.error) throw scoresRes.error
      if (snapshotRes.error) throw snapshotRes.error

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
            previous_position: null,
            delta: null,
          }
        })

      rows.sort(compareRanking)

      // Build the previous ranking from the snapshot and the SAME comparator.
      // Display names rarely change, so reuse the current name (snapshot has no
      // name column). Users absent from the current totals fall back to their
      // user_id for the deterministic tiebreaker only.
      const nameById = new Map(rows.map((r) => [r.user_id, r.display_name]))
      const previousRows = (snapshotRes.data ?? [])
        .filter((s) => s.user_id !== null)
        .map((s) => ({
          user_id: s.user_id as string,
          total_points: s.total_points ?? 0,
          exact_count: s.exact_count ?? 0,
          scored_count: s.scored_count ?? 0,
          display_name: nameById.get(s.user_id as string) ?? null,
        }))
        .sort(compareRanking)

      const prevPositionById = new Map<string, number>()
      previousRows.forEach((r, idx) => prevPositionById.set(r.user_id, idx + 1))

      rows.forEach((row, idx) => {
        const prev = prevPositionById.get(row.user_id)
        if (prev == null) return
        row.previous_position = prev
        row.delta = prev - (idx + 1)
      })

      return rows
    },
  })
}

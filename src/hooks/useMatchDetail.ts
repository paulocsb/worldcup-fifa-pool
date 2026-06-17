import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ApiEvent,
  ApiLineup,
  ApiTeamStatistics,
} from '@/lib/apiFootballTypes'
import type { Match, Team } from '@/types/db'

export interface MatchDetail extends Match {
  home_team: Team | null
  away_team: Team | null
  lineups_parsed: ApiLineup[] | null
  events_parsed: ApiEvent[] | null
  statistics_parsed: ApiTeamStatistics[] | null
}

export function useMatchDetail(matchId: number | null) {
  return useQuery<MatchDetail | null>({
    queryKey: ['match-detail', matchId],
    enabled: matchId != null,
    queryFn: async () => {
      if (matchId == null) return null
      const { data, error } = await supabase
        .from('matches')
        .select(
          '*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)',
        )
        .eq('id', matchId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const row = data as Match & {
        home_team: Team | null
        away_team: Team | null
      }
      return {
        ...row,
        lineups_parsed: (row.lineups as ApiLineup[] | null) ?? null,
        events_parsed: (row.events as ApiEvent[] | null) ?? null,
        statistics_parsed: (row.statistics as ApiTeamStatistics[] | null) ?? null,
      }
    },
  })
}

/**
 * Quando a página de detalhe abre, dispara sync-match-detail (idempotente
 * com TTL no servidor) e invalida o cache local quando voltar.
 */
export function useTriggerMatchDetailSync(matchId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (matchId == null) return
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-match-detail`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ match_id: matchId }),
        })
        if (!cancelled && res.ok) {
          const body = (await res.json()) as { refetched?: boolean }
          if (body?.refetched) {
            queryClient.invalidateQueries({
              queryKey: ['match-detail', matchId],
            })
          }
        }
      } catch {
        // ignora — UI já mostra o que tem em cache
      }
    })()

    return () => {
      cancelled = true
    }
  }, [matchId, queryClient])
}

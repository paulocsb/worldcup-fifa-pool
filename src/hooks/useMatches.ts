import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Match, Team } from '@/types/db'

export type MatchWithTeams = Match & {
  home_team: Team | null
  away_team: Team | null
}

export function useMatches() {
  return useQuery<MatchWithTeams[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          'id, home_team_id, away_team_id, kickoff_at, stage, group_letter, status, home_score, away_score, home_score_extra, away_score_extra, home_score_penalties, away_score_penalties, venue, venue_city, last_synced_at, created_at, elapsed_minutes, elapsed_extra_minutes, live_status_short, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)',
        )
        .order('kickoff_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as MatchWithTeams[]
    },
    staleTime: 30_000,
  })
}

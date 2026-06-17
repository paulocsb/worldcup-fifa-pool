import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/types/db'

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('group_letter', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Team[]
    },
  })
}

export function useTournamentLockOpen() {
  // Lock cai quando NÃO houver mais nenhuma partida 'group' com status='scheduled'
  return useQuery<{ open: boolean; remaining_group_matches: number }>({
    queryKey: ['tournament-lock'],
    staleTime: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('stage', 'group')
        .eq('status', 'scheduled')
      if (error) throw error
      const remaining = count ?? 0
      return { open: remaining > 0, remaining_group_matches: remaining }
    },
  })
}

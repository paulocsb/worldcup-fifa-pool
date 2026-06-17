import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TournamentPrediction } from '@/types/db'

export function useTournamentPrediction(userId: string | undefined) {
  return useQuery<TournamentPrediction | null>({
    queryKey: ['tournament-prediction', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('tournament_predictions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpsertTournamentPrediction(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      champion_team_id: number
      runner_up_team_id: number
      third_place_team_id: number
    }) => {
      if (!userId) throw new Error('Sem sessão')
      const { error } = await supabase
        .from('tournament_predictions')
        .upsert(
          {
            user_id: userId,
            champion_team_id: input.champion_team_id,
            runner_up_team_id: input.runner_up_team_id,
            third_place_team_id: input.third_place_team_id,
          },
          { onConflict: 'user_id' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tournament-prediction', userId],
      })
    },
  })
}

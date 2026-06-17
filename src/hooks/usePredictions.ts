import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Prediction } from '@/types/db'

export function useMyPredictions(userId: string | undefined) {
  return useQuery<Prediction[]>({
    queryKey: ['predictions', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId!)
      if (error) throw error
      return (data ?? []) as Prediction[]
    },
  })
}

export function useUpsertPrediction(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      match_id: number
      home_score: number
      away_score: number
    }) => {
      if (!userId) throw new Error('Sem sessão')
      const { error } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: userId,
            match_id: input.match_id,
            home_score: input.home_score,
            away_score: input.away_score,
          },
          { onConflict: 'user_id,match_id' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', userId] })
    },
  })
}

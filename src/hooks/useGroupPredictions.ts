import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GroupPrediction } from '@/types/db'

export type GroupLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'

export const ALL_GROUPS: GroupLetter[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
]

export function useMyGroupPredictions(userId: string | undefined) {
  return useQuery<GroupPrediction[]>({
    queryKey: ['group-predictions', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('group_predictions')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as GroupPrediction[]
    },
  })
}

export function useGroupLocks() {
  return useQuery<Record<string, boolean>>({
    queryKey: ['group-locks'],
    staleTime: 30_000,
    queryFn: async () => {
      // Lock global: todos os grupos fecham juntos quando o último jogo da
      // MD2 (qualquer grupo) terminar. Mesma regra que
      // public.group_predictions_open no servidor.
      const { data, error } = await supabase
        .from('matches')
        .select('status')
        .eq('stage', 'group')
        .eq('matchday', 2)
      if (error) throw error

      const globalOpen = (data ?? []).some((m) => m.status !== 'finished')
      const open: Record<string, boolean> = {}
      for (const letter of ALL_GROUPS) open[letter] = globalOpen
      return open
    },
  })
}

export function useUpsertGroupPrediction(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      group_letter: GroupLetter
      first_team_id: number
      second_team_id: number
      third_team_id: number
      fourth_team_id: number
    }) => {
      if (!userId) throw new Error('Sem sessão')
      const { error } = await supabase
        .from('group_predictions')
        .upsert(
          {
            user_id: userId,
            group_letter: input.group_letter,
            first_team_id: input.first_team_id,
            second_team_id: input.second_team_id,
            third_team_id: input.third_team_id,
            fourth_team_id: input.fourth_team_id,
          },
          { onConflict: 'user_id,group_letter' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group-predictions', userId],
      })
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserTotalScore } from '@/types/db'

export function useRanking() {
  return useQuery<UserTotalScore[]>({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_total_scores')
        .select('*')
        .order('total_points', { ascending: false })
      if (error) throw error
      return (data ?? []) as UserTotalScore[]
    },
    staleTime: 60_000,
  })
}

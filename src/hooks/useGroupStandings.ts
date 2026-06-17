import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GroupStanding } from '@/types/db'

export function useGroupStandings() {
  return useQuery<GroupStanding[]>({
    queryKey: ['group-standings'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_standings')
        .select('*')
        .order('group_letter')
        .order('position')
      if (error) throw error
      return (data ?? []) as GroupStanding[]
    },
  })
}

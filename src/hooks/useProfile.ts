import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/db'

export function useProfile(userId: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

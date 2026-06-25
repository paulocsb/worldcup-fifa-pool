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

const LOCK_MINUTES_BEFORE_MD3 = 5

export function useGroupLocks() {
  return useQuery<Record<string, boolean>>({
    queryKey: ['group-locks'],
    staleTime: 30_000,
    queryFn: async () => {
      // Lock: aberto SE nenhum jogo da MD3 do grupo já começou
      // E nenhum está nos últimos 5min antes do kickoff.
      const { data, error } = await supabase
        .from('matches')
        .select('group_letter, kickoff_at, status, matchday')
        .eq('stage', 'group')
        .eq('matchday', 3)
      if (error) throw error

      const now = Date.now()
      const lockMs = LOCK_MINUTES_BEFORE_MD3 * 60 * 1000
      const open: Record<string, boolean> = {}
      // Default: closed (caso o grupo nem tenha MD3 no DB)
      for (const letter of ALL_GROUPS) open[letter] = false

      // Acumula: aberto se TODAS as MD3 do grupo estiverem scheduled E pré-lock
      const groupHasMd3 = new Set<string>()
      const groupAllClear = new Map<string, boolean>()

      for (const m of data ?? []) {
        if (!m.group_letter) continue
        groupHasMd3.add(m.group_letter)
        const kickoff = new Date(m.kickoff_at).getTime()
        const isStillScheduled = m.status === 'scheduled'
        const isPreLock = kickoff - lockMs > now
        const matchOpen = isStillScheduled && isPreLock
        const prev = groupAllClear.get(m.group_letter)
        groupAllClear.set(
          m.group_letter,
          prev === undefined ? matchOpen : prev && matchOpen,
        )
      }

      for (const letter of ALL_GROUPS) {
        if (groupHasMd3.has(letter)) {
          open[letter] = groupAllClear.get(letter) ?? false
        }
      }
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

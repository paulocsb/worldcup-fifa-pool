import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Invite } from '@/types/db'

export function useInvites() {
  return useQuery<Invite[]>({
    queryKey: ['invites'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Invite[]
    },
  })
}

interface CreateInviteInput {
  code: string
  description?: string
  max_uses?: number | null
  expires_at?: string | null
}

export function useCreateInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInviteInput) => {
      const { error } = await supabase.from('invites').insert({
        code: input.code,
        description: input.description ?? null,
        max_uses: input.max_uses ?? null,
        expires_at: input.expires_at ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

export function useDeleteInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from('invites').delete().eq('code', code)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

/** Gera código curto (8 chars), sem caracteres ambíguos (0, o, 1, l, i) */
export function randomInviteCode(len = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

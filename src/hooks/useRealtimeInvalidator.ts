import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface RealtimeInvalidatorConfig {
  /** Tabelas a observar */
  tables: ReadonlyArray<'matches' | 'scores'>
  /** Query keys a invalidar quando qualquer evento chegar */
  queryKeys: ReadonlyArray<QueryKey>
}

/**
 * Subscreve eventos Postgres Changes nas tabelas indicadas e invalida
 * as queries do TanStack Query correspondentes. Único canal por instância;
 * canal é limpo no unmount.
 *
 * Uso típico:
 *   useRealtimeInvalidator({ tables: ['matches'], queryKeys: [['matches']] })
 */
export function useRealtimeInvalidator({
  tables,
  queryKeys,
}: RealtimeInvalidatorConfig) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channelName = `realtime-${tables.join('-')}-${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase.channel(channelName)

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of queryKeys) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        },
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(','), JSON.stringify(queryKeys)])
}

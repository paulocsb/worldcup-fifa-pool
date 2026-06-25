import { useMemo } from 'react'
import { useGroupStandings } from '@/hooks/useGroupStandings'
import { useMatches } from '@/hooks/useMatches'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { buildBracketResolveContext } from '@/lib/bracketStructure'
import {
  buildBracketNodes,
  bracketNodesForStages,
  type BracketNodeItem,
} from '@/lib/bracketNodes'
import type { MatchStage } from '@/types/db'

export type { BracketNodeItem } from '@/lib/bracketNodes'

interface UseBracketNodesResult {
  /** Every knockout node, indexed by official fixture ref (73-104). */
  byRef: Map<number, BracketNodeItem>
  /** Nodes for the given stages, sorted by ref (ascending). */
  forStages: (stages: ReadonlyArray<MatchStage>) => BracketNodeItem[]
  isPending: boolean
  isError: boolean
  error: Error | null
}

/**
 * Single source for the knockout tree's nodes. Encapsulates `useMatches` +
 * `useGroupStandings` (and their realtime invalidation), resolves slots against
 * the completed-group standings and matches fixtures by team identity.
 *
 * Returns ALL knockout nodes indexed by `ref` plus a `forStages` selector — so
 * BracketPhase (list per tab) and the tree (Phase 2.2) share one computation.
 *
 * Predictions are intentionally NOT included here — they belong to the
 * MatchCard/PredictionSheet layer. Consumers read `dbMatch` and bring their own
 * predictions (see BracketPhase).
 */
export function useBracketNodes(): UseBracketNodesResult {
  const matches = useMatches()
  const standings = useGroupStandings()

  useRealtimeInvalidator({
    tables: ['matches'],
    queryKeys: [['matches'], ['group-standings']],
  })

  const byRef = useMemo(() => {
    const resolveCtx = buildBracketResolveContext(standings.data ?? [])
    return buildBracketNodes(matches.data ?? [], resolveCtx)
  }, [matches.data, standings.data])

  const forStages = useMemo(
    () => (stages: ReadonlyArray<MatchStage>) =>
      bracketNodesForStages(byRef, stages),
    [byRef],
  )

  return {
    byRef,
    forStages,
    isPending: matches.isPending,
    isError: matches.isError,
    error: (matches.error as Error | null) ?? null,
  }
}

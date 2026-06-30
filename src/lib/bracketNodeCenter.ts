/**
 * Pure decision for the center spine of a compact bracket node (BracketNode).
 *
 * No React imports. Extracted so the FINISHED-score regression (a matched,
 * finished fixture was rendering "TBD" instead of its score) is unit-testable
 * without a DOM. The component renders the returned descriptor; this module
 * owns ONLY the state choice + winner convention (via `knockoutResult`).
 *
 * Three states, in priority order:
 *  1. matched fixture FINISHED → `score` (winner side flagged, penalties when
 *     shot out).
 *  2. matched fixture NOT finished → `time` from the fixture's own kickoff.
 *  3. no matched fixture (predicted) → `time` from the lent kickoff, else `tbd`.
 *
 * Why read `dbMatch.kickoff_at` and NOT `item.kickoffAt` for the matched case:
 * `item.kickoffAt` is populated ONLY for PREDICTED matchups (the 2nd pass in
 * buildBracketNodes), so for a matched fixture it's always null. The fixture
 * carries its own kickoff — use it.
 */

import type { BracketNodeItem } from '@/lib/bracketNodes'
import { knockoutResult } from '@/lib/knockoutResult'

export type BracketNodeCenter =
  | {
      kind: 'score'
      home: number
      away: number
      homeWins: boolean
      awayWins: boolean
      /** Penalty shootout result, present only when both pen scores are set. */
      penalties: { home: number; away: number } | null
    }
  /** ISO timestamp to format as HH:mm. */
  | { kind: 'time'; kickoffAt: string }
  /** Neither a finished score nor a known kickoff → render "TBD". */
  | { kind: 'tbd' }

export function bracketNodeCenter(item: BracketNodeItem): BracketNodeCenter {
  const { dbMatch, kickoffAt } = item

  if (dbMatch && dbMatch.status === 'finished') {
    const { winner } = knockoutResult(dbMatch)
    const homePens = dbMatch.home_score_penalties
    const awayPens = dbMatch.away_score_penalties
    return {
      kind: 'score',
      home: dbMatch.home_score ?? 0,
      away: dbMatch.away_score ?? 0,
      homeWins: winner != null && winner.id === dbMatch.home_team_id,
      awayWins: winner != null && winner.id === dbMatch.away_team_id,
      penalties:
        homePens != null && awayPens != null
          ? { home: homePens, away: awayPens }
          : null,
    }
  }

  if (dbMatch && dbMatch.kickoff_at) {
    return { kind: 'time', kickoffAt: dbMatch.kickoff_at }
  }
  if (kickoffAt) {
    return { kind: 'time', kickoffAt }
  }
  return { kind: 'tbd' }
}

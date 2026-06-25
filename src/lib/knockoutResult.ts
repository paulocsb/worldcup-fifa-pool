/**
 * Pure knockout result helper — decides the winner / loser of a FINISHED
 * knockout fixture, replicating the winner convention from MatchCard:312-330.
 *
 * No React imports. Used by the bracket fixed-point resolution (bracketNodes.ts)
 * to propagate winners/losers up the connected tree (winnerOf / loserOf slots).
 *
 * Convention (verbatim from MatchCard): a tie in normal/extra time that goes to
 * a penalty shootout is decided by `home_score_penalties` vs
 * `away_score_penalties`; otherwise by `home_score` vs `away_score`.
 */

import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Team } from '@/types/db'

/** Winner + loser of a knockout fixture, or `null` for each if undecidable. */
export interface KnockoutResult {
  winner: Team | null
  loser: Team | null
}

const EMPTY: KnockoutResult = { winner: null, loser: null }

/**
 * Resolves the winner/loser of a knockout fixture, but ONLY when:
 *  - the match `status` is `finished` (never propagate live/scheduled games), and
 *  - both teams are present, and
 *  - the score actually decides a winner (penalties when shot out, else the
 *    normal/extra-time score). A finished tie WITHOUT penalties is treated as
 *    undecided (should not happen in a real knockout) → `{ null, null }`.
 */
export function knockoutResult(match: MatchWithTeams): KnockoutResult {
  if (match.status !== 'finished') return EMPTY
  if (!match.home_team || !match.away_team) return EMPTY

  const homePens = match.home_score_penalties
  const awayPens = match.away_score_penalties
  const decidedByPenalties = homePens != null && awayPens != null

  let homeWins: boolean
  if (decidedByPenalties) {
    if (homePens === awayPens) return EMPTY
    homeWins = homePens > awayPens
  } else {
    const homeScore = match.home_score
    const awayScore = match.away_score
    if (homeScore == null || awayScore == null) return EMPTY
    if (homeScore === awayScore) return EMPTY // tie without penalties → undecided
    homeWins = homeScore > awayScore
  }

  return homeWins
    ? { winner: match.home_team, loser: match.away_team }
    : { winner: match.away_team, loser: match.home_team }
}

/**
 * Pure bracket-node assembly — extracted VERBATIM from BracketPhase's `sections`
 * memo (src/components/BracketPhase.tsx) so the tree UI (Phase 2.2) and the
 * compact node (2.1) can reuse the exact same resolution + DB-matching logic.
 *
 * No React imports. Given the official bracket config (refs 73-104), the group
 * standings context and the DB matches, it produces ONE node per official
 * matchup, indexed by `ref`. Each node carries everything BracketPhase already
 * computed: the config `BracketMatch`, the resolved home/away teams, the matched
 * `dbMatch` (par de times, ambos resolvidos) and the kickoff/venue read from the
 * fixture associated by ≥1 resolved team.
 *
 * Behavior is IDENTICAL to the old inline logic — see BracketPhase doc comments.
 */

import type { MatchStage, Team } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'
import {
  bracketMatchesForStage,
  hasBracketStructure,
  resolveSlot,
  type BracketMatch,
  type BracketResolveContext,
} from '@/lib/bracketStructure'

/** All knockout stages with an encoded bracket, in official chain order. */
export const KNOCKOUT_STAGES: ReadonlyArray<MatchStage> = [
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
] as const

/**
 * A fully-assembled node for ONE official matchup. Reusable by:
 * - BracketPhase (list view, Phase 2.0 refactor)
 * - BracketNode (compact tile, Phase 2.1)
 * - the tree (Phase 2.2)
 *
 * `dbMatch` present → real fixture matched by IDENTITY (par de ids), render the
 * full MatchCard. Absent → predicted matchup, render the preview card/tile with
 * slot labels + kickoff/TBD.
 */
export interface BracketNodeItem {
  /** Official config for this matchup (ref, stage, order, slots). */
  bracket: BracketMatch
  resolvedHome: Team | null
  resolvedAway: Team | null
  /** Fixture matched by team pair (both sides resolved), or null. */
  dbMatch: MatchWithTeams | null
  /**
   * Kickoff of the fixture associated by ≥1 resolved team when the pair did NOT
   * match (predicted matchup). Used for the center time box / TBD.
   */
  kickoffAt: string | null
  /** Venue of the associated fixture (header enrichment). */
  venue: string | null
  /** Venue city of the associated fixture (via venueLabel). */
  venueCity: string | null
}

/**
 * Builds every knockout node across ALL bracket stages at once, indexed by
 * official `ref`. The DB-matching is scoped PER STAGE (a `usedDbIds` set per
 * stage) exactly like BracketPhase did, so a fixture is consumed by at most one
 * matchup and reads are never duplicated.
 */
export function buildBracketNodes(
  matches: ReadonlyArray<MatchWithTeams>,
  resolveCtx: BracketResolveContext,
): Map<number, BracketNodeItem> {
  const byRef = new Map<number, BracketNodeItem>()

  for (const stage of KNOCKOUT_STAGES) {
    if (!hasBracketStructure(stage)) continue

    const config = bracketMatchesForStage(stage)
    const dbForStage = matches.filter((m) => m.stage === stage)
    const usedDbIds = new Set<number>()

    // 1st pass: match by team PAIR (both resolved) → dbMatch. Consume fixture.
    const stageItems: BracketNodeItem[] = config.map((bracket) => {
      const resolvedHome = resolveSlot(bracket.home, resolveCtx)
      const resolvedAway = resolveSlot(bracket.away, resolveCtx)

      let dbMatch: MatchWithTeams | null = null
      if (resolvedHome && resolvedAway) {
        const homeId = resolvedHome.id
        const awayId = resolvedAway.id
        dbMatch =
          dbForStage.find(
            (m) =>
              !usedDbIds.has(m.id) &&
              m.home_team_id != null &&
              m.away_team_id != null &&
              ((m.home_team_id === homeId && m.away_team_id === awayId) ||
                (m.home_team_id === awayId && m.away_team_id === homeId)),
          ) ?? null
        if (dbMatch) usedDbIds.add(dbMatch.id)
      }

      return {
        bracket,
        resolvedHome,
        resolvedAway,
        dbMatch,
        kickoffAt: null,
        venue: null,
        venueCity: null,
      }
    })

    // 2nd pass: predicted matchups with ≥1 resolved team read kickoff/venue from
    // a non-consumed fixture containing that team by id (unambiguous: one game
    // per team per stage).
    for (const item of stageItems) {
      if (item.dbMatch) continue
      const resolvedTeam = item.resolvedHome ?? item.resolvedAway
      if (!resolvedTeam) continue
      const teamId = resolvedTeam.id
      const dbWithTeam = dbForStage.find(
        (m) =>
          !usedDbIds.has(m.id) &&
          (m.home_team_id === teamId || m.away_team_id === teamId) &&
          m.kickoff_at != null,
      )
      if (dbWithTeam) {
        item.kickoffAt = dbWithTeam.kickoff_at
        item.venue = dbWithTeam.venue
        item.venueCity = dbWithTeam.venue_city
      }
    }

    for (const item of stageItems) byRef.set(item.bracket.ref, item)
  }

  return byRef
}

/** Nodes for a set of stages, in official ref order (ascending). */
export function bracketNodesForStages(
  byRef: ReadonlyMap<number, BracketNodeItem>,
  stages: ReadonlyArray<MatchStage>,
): BracketNodeItem[] {
  const wanted = new Set(stages)
  return [...byRef.values()]
    .filter((item) => wanted.has(item.bracket.stage))
    .sort((a, b) => a.bracket.ref - b.bracket.ref)
}

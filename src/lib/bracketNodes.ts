/**
 * Pure bracket-node assembly — the "living tree" (Phase 2.4).
 *
 * Originally extracted VERBATIM from BracketPhase's `sections` memo so the tree
 * UI (Phase 2.2) and the compact node (2.1) could reuse the exact resolution +
 * DB-matching logic. Phase 2.4 upgrades the resolution to a FIXED-POINT pass that
 * also resolves `best3rd`, `winnerOf` and `loserOf` as fixtures finish, while
 * keeping the output shape (`Map<ref, BracketNodeItem>`) identical.
 *
 * No React imports. Given the official bracket config (refs 73-104), the group
 * standings context and the DB matches, it produces ONE node per official
 * matchup, indexed by `ref`. Each node carries everything BracketPhase already
 * computed: the config `BracketMatch`, the resolved home/away teams, the matched
 * `dbMatch` (par de times, ambos resolvidos) and the kickoff/venue read from the
 * fixture associated by ≥1 resolved team.
 */

import type { MatchStage, Team } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'
import {
  bracketMatchesForStage,
  hasBracketStructure,
  resolveSlot,
  type BracketMatch,
  type BracketResolveContext,
  type BracketSlot,
} from '@/lib/bracketStructure'
import { knockoutResult } from '@/lib/knockoutResult'

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

// ---------------------------------------------------------------------------
// Fixed-point resolution of the connected tree (Phase 2.4)
// ---------------------------------------------------------------------------

/** Mutable accumulator threaded through the fixed-point iteration. */
interface ResolveState {
  /** Resolved home/away teams per ref (slots → concrete teams). */
  readonly home: Map<number, Team>
  readonly away: Map<number, Team>
  /** Winner / loser of fixtures already FINISHED (drives winnerOf/loserOf). */
  readonly winners: Map<number, Team>
  readonly losers: Map<number, Team>
  /** The 3rd-placed team allocated to the game at each ref (best3rd slot). */
  readonly best3rdByRef: Map<number, Team>
  /** DB fixture matched (by team pair) per ref. */
  readonly dbMatchByRef: Map<number, MatchWithTeams>
  /** DB ids consumed by a pair match, scoped per stage, so none is reused. */
  readonly usedDbIdsByStage: Map<MatchStage, Set<number>>
}

function emptyState(): ResolveState {
  return {
    home: new Map(),
    away: new Map(),
    winners: new Map(),
    losers: new Map(),
    best3rdByRef: new Map(),
    dbMatchByRef: new Map(),
    usedDbIdsByStage: new Map(),
  }
}

/** The team already pinned to the OTHER side of the same matchup, if any. */
function partnerTeam(
  bracket: BracketMatch,
  side: 'home' | 'away',
  state: ResolveState,
): Team | null {
  return side === 'home'
    ? (state.away.get(bracket.ref) ?? null)
    : (state.home.get(bracket.ref) ?? null)
}

/**
 * Resolves the 3rd-placed team for a `best3rd` slot WITHOUT hard-coding FIFA's
 * Annex C (the 495-combination allocation table). Instead we read the OFFICIAL
 * fixture from the DB as the source of truth:
 *
 *   1. Wait until the OTHER side of this same matchup is resolved to a team `T`
 *      (group winner / runner-up, already known when the group is complete).
 *   2. Find the `round_of_32` fixture that contains `T`; the OTHER team in that
 *      fixture is the 3rd-placed side → that's our best3rd.
 *
 * Candidate-group validation is optional (the fixture is authoritative); we keep
 * it as a soft guard only. Returns `null` until the partner side and a matching
 * fixture both exist.
 */
function resolveBest3rd(
  bracket: BracketMatch,
  slot: Extract<BracketSlot, { kind: 'best3rd' }>,
  side: 'home' | 'away',
  r32Fixtures: ReadonlyArray<MatchWithTeams>,
  state: ResolveState,
): Team | null {
  const partner = partnerTeam(bracket, side, state)
  if (!partner) return null

  // The candidate-group set is a soft hint only; the official fixture is the
  // source of truth, so we accept the partner's opponent regardless. Reference
  // `slot.candidates` so the (intentional) leniency is explicit, not forgotten.
  void slot.candidates

  for (const fx of r32Fixtures) {
    if (fx.home_team_id == null || fx.away_team_id == null) continue
    if (fx.home_team_id === partner.id && fx.away_team) return fx.away_team
    if (fx.away_team_id === partner.id && fx.home_team) return fx.home_team
  }
  return null
}

/** Resolves a single slot to a team in the current state, or `null` (yet). */
function resolveSide(
  bracket: BracketMatch,
  side: 'home' | 'away',
  slot: BracketSlot,
  resolveCtx: BracketResolveContext,
  r32Fixtures: ReadonlyArray<MatchWithTeams>,
  state: ResolveState,
): Team | null {
  switch (slot.kind) {
    case 'groupWinner':
    case 'groupRunnerUp':
      return resolveSlot(slot, resolveCtx)
    case 'winnerOf':
      return state.winners.get(slot.match) ?? null
    case 'loserOf':
      return state.losers.get(slot.match) ?? null
    case 'best3rd': {
      const existing = state.best3rdByRef.get(bracket.ref)
      if (existing) return existing
      const team = resolveBest3rd(bracket, slot, side, r32Fixtures, state)
      if (team) state.best3rdByRef.set(bracket.ref, team)
      return team
    }
  }
}

/**
 * Finds the DB fixture for a matchup by TEAM PAIR (both sides resolved), scoped
 * to the matchup's stage and skipping fixtures already consumed by another ref —
 * exactly like the original 1st pass in `buildBracketNodes`.
 */
function matchFixtureByPair(
  home: Team,
  away: Team,
  dbForStage: ReadonlyArray<MatchWithTeams>,
  used: Set<number>,
): MatchWithTeams | null {
  const a = home.id
  const b = away.id
  return (
    dbForStage.find(
      (m) =>
        !used.has(m.id) &&
        m.home_team_id != null &&
        m.away_team_id != null &&
        ((m.home_team_id === a && m.away_team_id === b) ||
          (m.home_team_id === b && m.away_team_id === a)),
    ) ?? null
  )
}

/**
 * Runs the fixed-point: repeatedly walks every matchup (73→104) resolving slots
 * and propagating winners/losers from finished fixtures, until a full pass makes
 * NO progress. Multi-level chains (R32→R16→…→Final) converge over several passes.
 */
function runFixedPoint(
  matches: ReadonlyArray<MatchWithTeams>,
  resolveCtx: BracketResolveContext,
): ResolveState {
  const state = emptyState()

  // Pre-group fixtures per stage and grab the R32 set for best3rd lookups.
  const dbByStage = new Map<MatchStage, MatchWithTeams[]>()
  for (const stage of KNOCKOUT_STAGES) {
    dbByStage.set(
      stage,
      matches.filter((m) => m.stage === stage),
    )
    state.usedDbIdsByStage.set(stage, new Set<number>())
  }
  const r32Fixtures = dbByStage.get('round_of_32') ?? []

  // All matchups in ascending ref order, with their stage's DB fixtures.
  const allMatchups: BracketMatch[] = []
  for (const stage of KNOCKOUT_STAGES) {
    if (!hasBracketStructure(stage)) continue
    for (const m of bracketMatchesForStage(stage)) allMatchups.push(m)
  }
  allMatchups.sort((a, b) => a.ref - b.ref)

  let progressed = true
  while (progressed) {
    progressed = false

    for (const bracket of allMatchups) {
      const used = state.usedDbIdsByStage.get(bracket.stage)
      if (!used) continue
      const dbForStage = dbByStage.get(bracket.stage) ?? []

      // 1) Resolve home/away if not already pinned.
      let home = state.home.get(bracket.ref) ?? null
      if (!home) {
        home = resolveSide(
          bracket,
          'home',
          bracket.home,
          resolveCtx,
          r32Fixtures,
          state,
        )
        if (home) {
          state.home.set(bracket.ref, home)
          progressed = true
        }
      }

      let away = state.away.get(bracket.ref) ?? null
      if (!away) {
        away = resolveSide(
          bracket,
          'away',
          bracket.away,
          resolveCtx,
          r32Fixtures,
          state,
        )
        if (away) {
          state.away.set(bracket.ref, away)
          progressed = true
        }
      }

      // 2) Both sides resolved → match the DB fixture by pair (once) and, if the
      //    game is finished, record winner/loser to feed downstream matchups.
      if (home && away && !state.dbMatchByRef.has(bracket.ref)) {
        const fixture = matchFixtureByPair(home, away, dbForStage, used)
        if (fixture) {
          used.add(fixture.id)
          state.dbMatchByRef.set(bracket.ref, fixture)
          progressed = true

          const { winner, loser } = knockoutResult(fixture)
          if (winner && loser) {
            state.winners.set(bracket.ref, winner)
            state.losers.set(bracket.ref, loser)
          }
        }
      }
    }
  }

  return state
}

/**
 * Builds every knockout node across ALL bracket stages at once, indexed by
 * official `ref`. Resolution is the fixed-point above (groups + best3rd +
 * winnerOf/loserOf); the DB-matching stays scoped per stage so a fixture is
 * consumed by at most one matchup. A 2nd pass enriches predicted matchups
 * (no pair fixture) with kickoff/venue from a fixture containing ≥1 resolved
 * team — identical to the original behavior.
 */
export function buildBracketNodes(
  matches: ReadonlyArray<MatchWithTeams>,
  resolveCtx: BracketResolveContext,
): Map<number, BracketNodeItem> {
  const byRef = new Map<number, BracketNodeItem>()
  const state = runFixedPoint(matches, resolveCtx)

  for (const stage of KNOCKOUT_STAGES) {
    if (!hasBracketStructure(stage)) continue

    const config = bracketMatchesForStage(stage)
    const dbForStage = matches.filter((m) => m.stage === stage)
    const used = state.usedDbIdsByStage.get(stage) ?? new Set<number>()

    const stageItems: BracketNodeItem[] = config.map((bracket) => ({
      bracket,
      resolvedHome: state.home.get(bracket.ref) ?? null,
      resolvedAway: state.away.get(bracket.ref) ?? null,
      dbMatch: state.dbMatchByRef.get(bracket.ref) ?? null,
      kickoffAt: null,
      venue: null,
      venueCity: null,
    }))

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
          !used.has(m.id) &&
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

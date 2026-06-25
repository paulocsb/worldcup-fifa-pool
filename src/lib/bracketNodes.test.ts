import { describe, expect, it } from 'vitest'
import { buildBracketNodes } from './bracketNodes'
import {
  bracketMatchesForStage,
  type BracketMatch,
  type BracketMatchRef,
  type BracketResolveContext,
} from './bracketStructure'
import type { GroupLetter } from './groupColors'
import type { MatchStage, MatchStatus, Team } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'

// ---------------------------------------------------------------------------
// Synthetic fixture builders
// ---------------------------------------------------------------------------

function team(id: number, code: string, group: GroupLetter = 'A'): Team {
  return {
    id,
    name: code,
    code,
    flag_url: null,
    group_letter: group,
    fifa_ranking: null,
    api_team_id: null,
    created_at: '',
  }
}

let matchSeq = 1000

interface MatchOpts {
  status?: MatchStatus
  home?: number | null
  away?: number | null
  homePens?: number | null
  awayPens?: number | null
}

function match(
  stage: MatchStage,
  homeTeam: Team,
  awayTeam: Team,
  opts: MatchOpts = {},
): MatchWithTeams {
  const status = opts.status ?? 'finished'
  return {
    id: matchSeq++,
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: '2026-07-01T18:00:00Z',
    stage,
    group_letter: null,
    status,
    home_score: opts.home ?? null,
    away_score: opts.away ?? null,
    home_score_extra: null,
    away_score_extra: null,
    home_score_penalties: opts.homePens ?? null,
    away_score_penalties: opts.awayPens ?? null,
    venue: 'Synthetic Stadium',
    venue_city: 'Test City',
    last_synced_at: null,
    created_at: '',
    elapsed_minutes: null,
    elapsed_extra_minutes: null,
    live_status_short: null,
    detail_synced_at: null,
    events: null,
    lineups: null,
    matchday: null,
    statistics: null,
  }
}

/**
 * Builds a resolve context with the given groups marked complete. Each group
 * gets four teams at positions 1-4; ids are deterministic per (letter, pos).
 */
function ctxWithGroups(
  groups: ReadonlyArray<GroupLetter>,
): { ctx: BracketResolveContext; teamFor: (g: GroupLetter, pos: number) => Team } {
  const completedGroups = new Map<GroupLetter, Map<number, Team>>()
  const teams = new Map<string, Team>()
  const idFor = (g: GroupLetter, pos: number) =>
    (g.charCodeAt(0) - 64) * 10 + pos // A1 -> 11, B2 -> 22 …
  for (const g of groups) {
    const byPos = new Map<number, Team>()
    for (let pos = 1; pos <= 4; pos++) {
      const t = team(idFor(g, pos), `${g}${pos}`, g)
      byPos.set(pos, t)
      teams.set(`${g}${pos}`, t)
    }
    completedGroups.set(g, byPos)
  }
  const teamFor = (g: GroupLetter, pos: number) => {
    const t = teams.get(`${g}${pos}`)
    if (!t) throw new Error(`no team ${g}${pos}`)
    return t
  }
  return { ctx: { completedGroups }, teamFor }
}

const ALL_GROUPS: GroupLetter[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
]

/** Config indexed by ref across all knockout stages. */
const CONFIG_BY_REF: ReadonlyMap<BracketMatchRef, BracketMatch> = (() => {
  const map = new Map<BracketMatchRef, BracketMatch>()
  const stages: MatchStage[] = [
    'round_of_32',
    'round_of_16',
    'quarter_final',
    'semi_final',
    'third_place',
    'final',
  ]
  for (const s of stages)
    for (const m of bracketMatchesForStage(s)) map.set(m.ref, m)
  return map
})()

/**
 * Deterministically plays out the ENTIRE knockout bracket from complete groups,
 * returning every finished fixture plus the winner/loser per ref. The home side
 * always wins (simple, deterministic), except best3rd opponents are minted as
 * fresh teams so the partner-fixture lookup has something to read.
 *
 * This mirrors the real fixed-point: R32 pairs come from the group context, then
 * each later round pairs the winners of its two feeders.
 */
function playWholeBracket(
  teamFor: (g: GroupLetter, pos: number) => Team,
): {
  fixtures: MatchWithTeams[]
  winnerOf: Map<BracketMatchRef, Team>
  loserOf: Map<BracketMatchRef, Team>
} {
  const fixtures: MatchWithTeams[] = []
  const winnerOf = new Map<BracketMatchRef, Team>()
  const loserOf = new Map<BracketMatchRef, Team>()
  let best3rdSeq = 8000

  const sideTeam = (
    ref: BracketMatchRef,
    side: 'home' | 'away',
  ): Team => {
    const cfg = CONFIG_BY_REF.get(ref)!
    const slot = side === 'home' ? cfg.home : cfg.away
    switch (slot.kind) {
      case 'groupWinner':
        return teamFor(slot.group, 1)
      case 'groupRunnerUp':
        return teamFor(slot.group, 2)
      case 'best3rd':
        // Mint a synthetic 3rd from the first candidate group's pos 3.
        return team(best3rdSeq++, `B3-${ref}`, slot.candidates[0])
      case 'winnerOf':
        return winnerOf.get(slot.match)!
      case 'loserOf':
        return loserOf.get(slot.match)!
    }
  }

  // Refs in dependency order (R32 → … → final/third).
  const order: BracketMatchRef[] = [...CONFIG_BY_REF.keys()].sort(
    (a, b) => a - b,
  )
  for (const ref of order) {
    const cfg = CONFIG_BY_REF.get(ref)!
    const home = sideTeam(ref, 'home')
    const away = sideTeam(ref, 'away')
    const fx = match(cfg.stage, home, away, {
      status: 'finished',
      home: 2,
      away: 1,
    })
    fixtures.push(fx)
    winnerOf.set(ref, home)
    loserOf.set(ref, away)
  }
  return { fixtures, winnerOf, loserOf }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildBracketNodes — living tree (Phase 2.4)', () => {
  it('1) resolves best3rd from the partner fixture (game 74)', () => {
    // Game 74: home = 1E (groupWinner E). The R32 DB fixture pits 1E against a
    // 3rd-placed team X → 74.away must become X, no Annex C needed.
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const e1 = teamFor('E', 1)
    const x = team(999, 'X3rd', 'B') // a 3rd from group B (candidate of 74)
    const fixture74 = match('round_of_32', e1, x, { status: 'scheduled' })

    const byRef = buildBracketNodes([fixture74], ctx)
    const node = byRef.get(74)!
    expect(node.resolvedHome).toEqual(e1)
    expect(node.resolvedAway).toEqual(x)
    // Pair matched → dbMatch present (scheduled fixture still attaches).
    expect(node.dbMatch?.id).toBe(fixture74.id)
  })

  it('2) propagates winnerOf from R32 to R16 (73 → 90)', () => {
    // 73 = 2A vs 2B, finished, 2A wins. R16 game 90 home = winnerOf(73).
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const a2 = teamFor('A', 2)
    const b2 = teamFor('B', 2)
    const fixture73 = match('round_of_32', a2, b2, {
      status: 'finished',
      home: 2,
      away: 0,
    })

    const byRef = buildBracketNodes([fixture73], ctx)
    expect(byRef.get(73)!.dbMatch?.id).toBe(fixture73.id)
    // 90 home is winnerOf(73) → 2A.
    expect(byRef.get(90)!.resolvedHome).toEqual(a2)
  })

  it('3) propagates a multi-level chain up to a QF over several passes', () => {
    // Chain on the left half: 73 & 75 feed 90; 74 & 77 feed 89; 89 & 90 feed 97.
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const a2 = teamFor('A', 2)
    const b2 = teamFor('B', 2)
    const f1 = teamFor('F', 1)
    const c2 = teamFor('C', 2)
    const e1 = teamFor('E', 1)
    const i1 = teamFor('I', 1)
    const x74 = team(741, 'X74', 'B')
    const x77 = team(771, 'X77', 'D')

    const matches: MatchWithTeams[] = [
      // R32
      match('round_of_32', a2, b2, { status: 'finished', home: 1, away: 0 }), // 73 → a2
      match('round_of_32', f1, c2, { status: 'finished', home: 2, away: 1 }), // 75 → f1
      match('round_of_32', e1, x74, { status: 'finished', home: 3, away: 0 }), // 74 → e1
      match('round_of_32', i1, x77, { status: 'finished', home: 1, away: 0 }), // 77 → i1
      // R16: 90 = win73 vs win75 = a2 vs f1; 89 = win74 vs win77 = e1 vs i1
      match('round_of_16', a2, f1, { status: 'finished', home: 0, away: 2 }), // 90 → f1
      match('round_of_16', e1, i1, { status: 'finished', home: 1, away: 0 }), // 89 → e1
    ]

    const byRef = buildBracketNodes(matches, ctx)
    expect(byRef.get(90)!.resolvedHome).toEqual(a2)
    expect(byRef.get(90)!.resolvedAway).toEqual(f1)
    expect(byRef.get(89)!.resolvedHome).toEqual(e1)
    expect(byRef.get(89)!.resolvedAway).toEqual(i1)
    // QF 97 = win89 vs win90 = e1 (won 89) vs f1 (won 90).
    expect(byRef.get(97)!.resolvedHome).toEqual(e1)
    expect(byRef.get(97)!.resolvedAway).toEqual(f1)
  })

  it('4) resolves loserOf for the third-place play-off (103) + winnerOf final (104)', () => {
    // Play the whole bracket from complete groups; the third-place game must be
    // the two SEMI LOSERS and the final must be the two SEMI WINNERS.
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const { fixtures, winnerOf, loserOf } = playWholeBracket(teamFor)

    const byRef = buildBracketNodes(fixtures, ctx)

    // 103 = loserOf(101) vs loserOf(102).
    expect(byRef.get(103)!.resolvedHome).toEqual(loserOf.get(101))
    expect(byRef.get(103)!.resolvedAway).toEqual(loserOf.get(102))
    // 104 = winnerOf(101) vs winnerOf(102).
    expect(byRef.get(104)!.resolvedHome).toEqual(winnerOf.get(101))
    expect(byRef.get(104)!.resolvedAway).toEqual(winnerOf.get(102))
    // And the third-place fixture itself was matched by pair.
    expect(byRef.get(103)!.dbMatch).not.toBeNull()
  })

  it('5) decides the winner by penalties when normal time is tied', () => {
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const a2 = teamFor('A', 2)
    const b2 = teamFor('B', 2)
    const fixture73 = match('round_of_32', a2, b2, {
      status: 'finished',
      home: 1,
      away: 1,
      homePens: 3,
      awayPens: 4,
    })

    const byRef = buildBracketNodes([fixture73], ctx)
    // away (b2) won on penalties → 90 home = winnerOf(73) = b2.
    expect(byRef.get(90)!.resolvedHome).toEqual(b2)
  })

  it('6) does NOT propagate a non-finished fixture', () => {
    const { ctx, teamFor } = ctxWithGroups(ALL_GROUPS)
    const a2 = teamFor('A', 2)
    const b2 = teamFor('B', 2)
    const live73 = match('round_of_32', a2, b2, {
      status: 'live',
      home: 2,
      away: 0,
    })

    const byRef = buildBracketNodes([live73], ctx)
    // 73 still matched to its fixture, but the winner is NOT propagated.
    expect(byRef.get(73)!.dbMatch?.id).toBe(live73.id)
    expect(byRef.get(90)!.resolvedHome).toBeNull()
  })

  it('7) keeps group slots null while the group is incomplete (regression)', () => {
    // Only group A complete; B incomplete → 73 (2A vs 2B) has home but no away.
    const { ctx, teamFor } = ctxWithGroups(['A'])
    const a2 = teamFor('A', 2)

    const byRef = buildBracketNodes([], ctx)
    expect(byRef.get(73)!.resolvedHome).toEqual(a2)
    expect(byRef.get(73)!.resolvedAway).toBeNull()
    // No winner can propagate since the pair never resolves.
    expect(byRef.get(90)!.resolvedHome).toBeNull()
  })
})

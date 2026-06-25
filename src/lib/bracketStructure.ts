/**
 * Official FIFA World Cup 2026 knockout bracket structure (preview encoding).
 *
 * Source of truth: the OFFICIAL FIFA 2026 bracket (verified). Match numbers
 * 73-104 are the canonical fixture numbers; the tree below is fully CONNECTED
 * by those numbers (winnerOf/loserOf reference the exact preceding match), so
 * Phase 2 (the tree-shaped bracket UI) can reuse this without any extra data.
 *
 * Encoding (verbatim from the verified bracket):
 *
 *   Round of 32 (73-88): `home | away` where each side is a group winner
 *   (1X), group runner-up (2X) or the best 3rd-placed team among a fixed set
 *   of CANDIDATE groups (e.g. game 74 → "3rd of {A,B,C,D,F}"). The candidate
 *   set is part of the official draw and is encoded per match.
 *
 *   Round of 16 (89-96), Quarters (97-100), Semis (101-102): winnerOf the two
 *   feeding matches.
 *
 *   Third place (103): loserOf 101 | loserOf 102.
 *   Final (104): winnerOf 101 | winnerOf 102.
 *
 * No React imports — pure data + label helpers (label formatting is i18n-based
 * and consumed via formatSlotLabel).
 */

import type { GroupStanding, MatchStage, Team } from '@/types/db'
import type { GroupLetter } from '@/lib/groupColors'
import type { TFunction } from 'i18next'

// ---------------------------------------------------------------------------
// Slot model
// ---------------------------------------------------------------------------

/** Official fixture number (73-104). Doubles as the stable ref. */
export type BracketMatchRef = number

/** A single side of a knockout matchup, before teams are known. */
export type BracketSlot =
  /** 1st place of a group (e.g. "1º A"). */
  | { kind: 'groupWinner'; group: GroupLetter }
  /** 2nd place of a group (e.g. "2º F"). */
  | { kind: 'groupRunnerUp'; group: GroupLetter }
  /**
   * Best 3rd-placed team among a fixed set of CANDIDATE groups (official draw).
   * e.g. game 74 → candidates {A,B,C,D,F}.
   */
  | { kind: 'best3rd'; candidates: ReadonlyArray<GroupLetter> }
  /** Winner of a specific previous match (connected tree, by fixture number). */
  | { kind: 'winnerOf'; match: BracketMatchRef }
  /** Loser of a specific previous match (third-place play-off). */
  | { kind: 'loserOf'; match: BracketMatchRef }

/** One knockout matchup in the official preview order. */
export interface BracketMatch {
  /** Official fixture number (73-104), unique across the bracket. */
  ref: BracketMatchRef
  stage: MatchStage
  /** 1-based position within the stage, following the official order. */
  order: number
  home: BracketSlot
  away: BracketSlot
}

// ---------------------------------------------------------------------------
// Slot constructors
// ---------------------------------------------------------------------------

const gw = (group: GroupLetter): BracketSlot => ({ kind: 'groupWinner', group })
const ru = (group: GroupLetter): BracketSlot => ({ kind: 'groupRunnerUp', group })
const b3 = (...candidates: GroupLetter[]): BracketSlot => ({
  kind: 'best3rd',
  candidates,
})
const win = (match: BracketMatchRef): BracketSlot => ({ kind: 'winnerOf', match })
const lose = (match: BracketMatchRef): BracketSlot => ({ kind: 'loserOf', match })

// ---------------------------------------------------------------------------
// Round of 32 — official fixtures 73-88
// ---------------------------------------------------------------------------

const ROUND_OF_32: ReadonlyArray<BracketMatch> = [
  { ref: 73, stage: 'round_of_32', order: 1, home: ru('A'), away: ru('B') },
  { ref: 74, stage: 'round_of_32', order: 2, home: gw('E'), away: b3('A', 'B', 'C', 'D', 'F') },
  { ref: 75, stage: 'round_of_32', order: 3, home: gw('F'), away: ru('C') },
  { ref: 76, stage: 'round_of_32', order: 4, home: gw('C'), away: ru('F') },
  { ref: 77, stage: 'round_of_32', order: 5, home: gw('I'), away: b3('C', 'D', 'F', 'G', 'H') },
  { ref: 78, stage: 'round_of_32', order: 6, home: ru('E'), away: ru('I') },
  { ref: 79, stage: 'round_of_32', order: 7, home: gw('A'), away: b3('C', 'E', 'F', 'H', 'I') },
  { ref: 80, stage: 'round_of_32', order: 8, home: gw('L'), away: b3('E', 'H', 'I', 'J', 'K') },
  { ref: 81, stage: 'round_of_32', order: 9, home: gw('D'), away: b3('B', 'E', 'F', 'I', 'J') },
  { ref: 82, stage: 'round_of_32', order: 10, home: gw('G'), away: b3('A', 'E', 'H', 'I', 'J') },
  { ref: 83, stage: 'round_of_32', order: 11, home: ru('K'), away: ru('L') },
  { ref: 84, stage: 'round_of_32', order: 12, home: gw('H'), away: ru('J') },
  { ref: 85, stage: 'round_of_32', order: 13, home: gw('B'), away: b3('E', 'F', 'G', 'I', 'J') },
  { ref: 86, stage: 'round_of_32', order: 14, home: gw('J'), away: ru('H') },
  { ref: 87, stage: 'round_of_32', order: 15, home: gw('K'), away: b3('D', 'E', 'I', 'J', 'L') },
  { ref: 88, stage: 'round_of_32', order: 16, home: ru('D'), away: ru('G') },
] as const

// ---------------------------------------------------------------------------
// Round of 16 — official fixtures 89-96 (connected tree)
// ---------------------------------------------------------------------------

const ROUND_OF_16: ReadonlyArray<BracketMatch> = [
  { ref: 89, stage: 'round_of_16', order: 1, home: win(74), away: win(77) },
  { ref: 90, stage: 'round_of_16', order: 2, home: win(73), away: win(75) },
  { ref: 91, stage: 'round_of_16', order: 3, home: win(76), away: win(78) },
  { ref: 92, stage: 'round_of_16', order: 4, home: win(79), away: win(80) },
  { ref: 93, stage: 'round_of_16', order: 5, home: win(83), away: win(84) },
  { ref: 94, stage: 'round_of_16', order: 6, home: win(81), away: win(82) },
  { ref: 95, stage: 'round_of_16', order: 7, home: win(86), away: win(88) },
  { ref: 96, stage: 'round_of_16', order: 8, home: win(85), away: win(87) },
] as const

// ---------------------------------------------------------------------------
// Quarter-finals — official fixtures 97-100
// ---------------------------------------------------------------------------

const QUARTER_FINAL: ReadonlyArray<BracketMatch> = [
  { ref: 97, stage: 'quarter_final', order: 1, home: win(89), away: win(90) },
  { ref: 98, stage: 'quarter_final', order: 2, home: win(93), away: win(94) },
  { ref: 99, stage: 'quarter_final', order: 3, home: win(91), away: win(92) },
  { ref: 100, stage: 'quarter_final', order: 4, home: win(95), away: win(96) },
] as const

// ---------------------------------------------------------------------------
// Semi-finals — official fixtures 101-102
// ---------------------------------------------------------------------------

const SEMI_FINAL: ReadonlyArray<BracketMatch> = [
  { ref: 101, stage: 'semi_final', order: 1, home: win(97), away: win(98) },
  { ref: 102, stage: 'semi_final', order: 2, home: win(99), away: win(100) },
] as const

// ---------------------------------------------------------------------------
// Third place (103) + Final (104)
// ---------------------------------------------------------------------------

const THIRD_PLACE: ReadonlyArray<BracketMatch> = [
  { ref: 103, stage: 'third_place', order: 1, home: lose(101), away: lose(102) },
] as const

const FINAL: ReadonlyArray<BracketMatch> = [
  { ref: 104, stage: 'final', order: 1, home: win(101), away: win(102) },
] as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const BY_STAGE: Record<MatchStage, ReadonlyArray<BracketMatch>> = {
  group: [],
  round_of_32: ROUND_OF_32,
  round_of_16: ROUND_OF_16,
  quarter_final: QUARTER_FINAL,
  semi_final: SEMI_FINAL,
  third_place: THIRD_PLACE,
  final: FINAL,
}

/** Official preview matchups for a knockout stage, in official order. */
export function bracketMatchesForStage(
  stage: MatchStage,
): ReadonlyArray<BracketMatch> {
  return BY_STAGE[stage]
}

/** Whether we have an encoded preview for this stage. */
export function hasBracketStructure(stage: MatchStage): boolean {
  return BY_STAGE[stage].length > 0
}

// ---------------------------------------------------------------------------
// Label formatting (i18n) — keys in the `standings` namespace, `bracket.*`
// ---------------------------------------------------------------------------

/**
 * Localized label for a single slot (pt-BR / en via i18next).
 * `t` must be bound to the `standings` namespace.
 */
export function formatSlotLabel(slot: BracketSlot, t: TFunction): string {
  switch (slot.kind) {
    case 'groupWinner':
      return t('bracket.slotGroupWinner', { group: slot.group })
    case 'groupRunnerUp':
      return t('bracket.slotGroupRunnerUp', { group: slot.group })
    case 'best3rd':
      return t('bracket.slotBest3rd', { groups: slot.candidates.join('/') })
    case 'winnerOf':
      return t('bracket.slotWinnerOf', { match: slot.match })
    case 'loserOf':
      return t('bracket.slotLoserOf', { match: slot.match })
  }
}

// ---------------------------------------------------------------------------
// Slot resolution against group standings (Phase 1: group winner / runner-up)
// ---------------------------------------------------------------------------

/** Each group plays 6 games; with 4 teams that means 3 games per team. */
const GROUP_GAMES_PER_TEAM = 3

/**
 * Context for resolving knockout slots into concrete teams. Built from
 * `useGroupStandings` (see `buildBracketResolveContext`).
 */
export interface BracketResolveContext {
  /**
   * For each COMPLETED group, its teams indexed by 1-based final position
   * (1 → winner, 2 → runner-up, …). Groups still in progress are ABSENT — we
   * never resolve a slot from a provisional standing.
   */
  readonly completedGroups: ReadonlyMap<GroupLetter, ReadonlyMap<number, Team>>
}

/**
 * Resolves a single knockout slot to a concrete `Team`, or `null` if it can't
 * (yet) be resolved.
 *
 * Phase 1 only resolves `groupWinner` / `groupRunnerUp`, and ONLY when the
 * referenced group is fully decided (all four teams played their 3 games). A
 * provisional leader of an in-progress group is intentionally NOT resolved —
 * it could still drop. `best3rd` / `winnerOf` / `loserOf` always return `null`
 * for now (Phase 2: 3rd-placed allocation + the connected winners tree).
 */
export function resolveSlot(
  slot: BracketSlot,
  ctx: BracketResolveContext,
): Team | null {
  switch (slot.kind) {
    case 'groupWinner':
      return ctx.completedGroups.get(slot.group)?.get(1) ?? null
    case 'groupRunnerUp':
      return ctx.completedGroups.get(slot.group)?.get(2) ?? null
    case 'best3rd':
    case 'winnerOf':
    case 'loserOf':
      return null
  }
}

/**
 * Builds a `BracketResolveContext` from the flat `group_standings` rows.
 *
 * A group is considered COMPLETE only when it has 4 rows AND every team has
 * `played === 3` (all six group games finished). Incomplete or partial groups
 * are omitted, so `resolveSlot` falls back to the generic label for them.
 */
export function buildBracketResolveContext(
  standings: ReadonlyArray<GroupStanding>,
): BracketResolveContext {
  const byGroup = new Map<GroupLetter, GroupStanding[]>()
  for (const row of standings) {
    const letter = row.group_letter as GroupLetter | null
    if (!letter) continue
    const list = byGroup.get(letter) ?? []
    list.push(row)
    byGroup.set(letter, list)
  }

  const completedGroups = new Map<GroupLetter, Map<number, Team>>()
  for (const [letter, rows] of byGroup) {
    const complete =
      rows.length === 4 &&
      rows.every((r) => (r.played ?? 0) >= GROUP_GAMES_PER_TEAM)
    if (!complete) continue

    const byPosition = new Map<number, Team>()
    for (const row of rows) {
      const team = standingToTeam(row)
      if (row.position != null && team) byPosition.set(row.position, team)
    }
    completedGroups.set(letter, byPosition)
  }

  return { completedGroups }
}

/** Reconstructs a `Team` from a `group_standings` row (the view carries flag). */
function standingToTeam(row: GroupStanding): Team | null {
  if (row.team_id == null || !row.team_code) return null
  return {
    id: row.team_id,
    name: row.team_name ?? row.team_code,
    code: row.team_code,
    flag_url: row.flag_url,
    group_letter: row.group_letter ?? '',
    fifa_ranking: null,
    api_team_id: null,
    created_at: '',
  }
}

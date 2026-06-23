import { useTranslation } from 'react-i18next'
import type { Team } from '@/types/db'

/**
 * English names for the 48 teams in the FIFA World Cup 2026, keyed by FIFA
 * 3-letter code. The DB stores names in pt-BR (via `002_seed_teams.sql`),
 * so this mapping only carries the English alternatives.
 *
 * If a code is missing here, `displayTeamName` falls back to the DB name
 * (pt-BR), which is fine for codes shared between languages.
 */
const TEAM_NAME_EN: Record<string, string> = {
  // Group A
  MEX: 'Mexico',
  KOR: 'South Korea',
  RSA: 'South Africa',
  CZE: 'Czechia',
  // Group B
  CAN: 'Canada',
  SUI: 'Switzerland',
  QAT: 'Qatar',
  BIH: 'Bosnia & Herzegovina',
  // Group C
  BRA: 'Brazil',
  MAR: 'Morocco',
  SCO: 'Scotland',
  HAI: 'Haiti',
  // Group D
  USA: 'United States',
  PAR: 'Paraguay',
  TUR: 'Turkey',
  AUS: 'Australia',
  // Group E
  GER: 'Germany',
  ECU: 'Ecuador',
  CIV: 'Ivory Coast',
  CUW: 'Curaçao',
  // Group F
  NED: 'Netherlands',
  JPN: 'Japan',
  SWE: 'Sweden',
  TUN: 'Tunisia',
  // Group G
  BEL: 'Belgium',
  EGY: 'Egypt',
  IRN: 'Iran',
  NZL: 'New Zealand',
  // Group H
  ESP: 'Spain',
  URU: 'Uruguay',
  KSA: 'Saudi Arabia',
  CPV: 'Cape Verde',
  // Group I
  FRA: 'France',
  SEN: 'Senegal',
  NOR: 'Norway',
  IRQ: 'Iraq',
  // Group J
  ARG: 'Argentina',
  AUT: 'Austria',
  ALG: 'Algeria',
  JOR: 'Jordan',
  // Group K
  POR: 'Portugal',
  COL: 'Colombia',
  UZB: 'Uzbekistan',
  COD: 'DR Congo',
  // Group L
  ENG: 'England',
  CRO: 'Croatia',
  GHA: 'Ghana',
  PAN: 'Panama',
}

/**
 * Returns the team name in the active language. pt-BR uses the DB value
 * (already in Portuguese); en falls back to the mapping above.
 *
 * @example
 *   const name = useTeamName(match.home_team) // "Brazil" or "Brasil"
 */
export function useTeamName(team: Team | null | undefined): string {
  const { i18n } = useTranslation()
  if (!team) return '—'
  if (i18n.language?.startsWith('en')) {
    return TEAM_NAME_EN[team.code] ?? team.name
  }
  return team.name
}

/**
 * Imperative variant for components that already pull `i18n.language` from a
 * caller (or want to avoid an extra hook). Prefer `useTeamName` when in React.
 */
export function teamNameFor(
  team: Team | null | undefined,
  language: string | undefined,
): string {
  if (!team) return '—'
  if (language?.startsWith('en')) {
    return TEAM_NAME_EN[team.code] ?? team.name
  }
  return team.name
}

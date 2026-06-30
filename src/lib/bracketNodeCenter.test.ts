import { describe, expect, it } from 'vitest'
import { bracketNodeCenter } from './bracketNodeCenter'
import { bracketMatchesForStage, type BracketMatch } from './bracketStructure'
import type { BracketNodeItem } from './bracketNodes'
import type { MatchStatus, Team } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'

function team(id: number, code: string): Team {
  return {
    id,
    name: code,
    code,
    flag_url: null,
    group_letter: 'A',
    fifa_ranking: null,
    api_team_id: null,
    created_at: '',
  }
}

const HOME = team(1, 'GER')
const AWAY = team(2, 'PAR')

function fixture(opts: {
  status?: MatchStatus
  home?: number | null
  away?: number | null
  homePens?: number | null
  awayPens?: number | null
  kickoff?: string
}): MatchWithTeams {
  return {
    id: 73,
    home_team_id: HOME.id,
    away_team_id: AWAY.id,
    home_team: HOME,
    away_team: AWAY,
    kickoff_at: opts.kickoff ?? '2026-07-01T18:00:00Z',
    stage: 'round_of_32',
    group_letter: null,
    status: opts.status ?? 'finished',
    home_score: opts.home ?? null,
    away_score: opts.away ?? null,
    home_score_extra: null,
    away_score_extra: null,
    home_score_penalties: opts.homePens ?? null,
    away_score_penalties: opts.awayPens ?? null,
    venue: null,
    venue_city: null,
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

const R32_73: BracketMatch = bracketMatchesForStage('round_of_32')[0]

function node(over: Partial<BracketNodeItem>): BracketNodeItem {
  return {
    bracket: R32_73,
    resolvedHome: HOME,
    resolvedAway: AWAY,
    dbMatch: null,
    kickoffAt: null,
    venue: null,
    venueCity: null,
    ...over,
  }
}

describe('bracketNodeCenter — center spine decision', () => {
  it('REGRESSION: a matched FINISHED fixture shows its score, not TBD', () => {
    const center = bracketNodeCenter(
      node({ dbMatch: fixture({ status: 'finished', home: 2, away: 1 }) }),
    )
    expect(center).toEqual({
      kind: 'score',
      home: 2,
      away: 1,
      homeWins: true,
      awayWins: false,
      penalties: null,
    })
  })

  it('flags the away winner + penalties when the game was shot out', () => {
    const center = bracketNodeCenter(
      node({
        dbMatch: fixture({
          status: 'finished',
          home: 1,
          away: 1,
          homePens: 2,
          awayPens: 4,
        }),
      }),
    )
    expect(center).toMatchObject({
      kind: 'score',
      home: 1,
      away: 1,
      homeWins: false,
      awayWins: true,
      penalties: { home: 2, away: 4 },
    })
  })

  it('matched but NOT finished → kickoff time from the fixture itself', () => {
    const center = bracketNodeCenter(
      node({
        dbMatch: fixture({ status: 'scheduled', kickoff: '2026-07-02T20:00:00Z' }),
      }),
    )
    expect(center).toEqual({ kind: 'time', kickoffAt: '2026-07-02T20:00:00Z' })
  })

  it('predicted matchup with a lent kickoff → that time', () => {
    const center = bracketNodeCenter(
      node({ dbMatch: null, kickoffAt: '2026-07-03T15:00:00Z' }),
    )
    expect(center).toEqual({ kind: 'time', kickoffAt: '2026-07-03T15:00:00Z' })
  })

  it('predicted matchup with no kickoff → TBD', () => {
    const center = bracketNodeCenter(node({ dbMatch: null, kickoffAt: null }))
    expect(center).toEqual({ kind: 'tbd' })
  })
})

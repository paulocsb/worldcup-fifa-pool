/**
 * Pure scoring logic. Espelha a edge function `compute-scores` no servidor.
 * O servidor é a fonte da verdade; este módulo serve para preview no cliente
 * (ex.: "se esse placar bater, você ganha X pontos").
 *
 * Regras: docs/PLAN.md §"Regras de pontuação".
 */

export interface ScoringConfig {
  match: {
    exact_score: number
    correct_result: number
    correct_goal_diff_bonus: number
  }
  group: {
    first: number
    second: number
    third: number
    fourth: number
    qualifier_bonus_per_team: number
  }
  tournament: {
    champion: number
    runner_up: number
    third_place: number
  }
}

export const DEFAULT_SCORING: ScoringConfig = {
  match: { exact_score: 10, correct_result: 5, correct_goal_diff_bonus: 2 },
  group: {
    first: 5,
    second: 5,
    third: 3,
    fourth: 2,
    qualifier_bonus_per_team: 3,
  },
  tournament: { champion: 30, runner_up: 15, third_place: 10 },
}

export type MatchOutcome = 'home' | 'draw' | 'away'

export function outcomeOf(home: number, away: number): MatchOutcome {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

// ----------------------------------------------------------------------------
// Pontuação por partida
// ----------------------------------------------------------------------------
export interface MatchScoreInput {
  predicted_home: number
  predicted_away: number
  actual_home: number
  actual_away: number
}

export interface MatchScoreBreakdown {
  exact: number
  result: number
  goal_diff: number
}

export interface MatchScoreResult {
  points: number
  breakdown: MatchScoreBreakdown
}

export function scoreMatch(
  input: MatchScoreInput,
  config: ScoringConfig = DEFAULT_SCORING,
): MatchScoreResult {
  const { predicted_home, predicted_away, actual_home, actual_away } = input
  const breakdown: MatchScoreBreakdown = { exact: 0, result: 0, goal_diff: 0 }

  const isExact =
    predicted_home === actual_home && predicted_away === actual_away

  if (isExact) {
    breakdown.exact = config.match.exact_score
    return { points: breakdown.exact, breakdown }
  }

  const predictedOutcome = outcomeOf(predicted_home, predicted_away)
  const actualOutcome = outcomeOf(actual_home, actual_away)

  if (predictedOutcome === actualOutcome) {
    breakdown.result = config.match.correct_result
  }

  const predictedDiff = predicted_home - predicted_away
  const actualDiff = actual_home - actual_away
  if (predictedDiff === actualDiff && !isExact) {
    breakdown.goal_diff = config.match.correct_goal_diff_bonus
  }

  return {
    points: breakdown.result + breakdown.goal_diff,
    breakdown,
  }
}

// ----------------------------------------------------------------------------
// Pontuação de classificação de grupo
// ----------------------------------------------------------------------------
export interface GroupOrder {
  first_team_id: number
  second_team_id: number
  third_team_id: number
  fourth_team_id: number
}

export interface GroupScoreBreakdown {
  first: number
  second: number
  third: number
  fourth: number
  qualifier_bonus: number
}

/**
 * Compara palpite vs ordem final do grupo (após desempates oficiais).
 * `qualified` é o set de team_ids que avançaram aos 32-avos no torneio inteiro.
 */
export function scoreGroup(
  predicted: GroupOrder,
  actual: GroupOrder,
  qualified: ReadonlySet<number>,
  config: ScoringConfig = DEFAULT_SCORING,
): { points: number; breakdown: GroupScoreBreakdown } {
  const breakdown: GroupScoreBreakdown = {
    first: predicted.first_team_id === actual.first_team_id ? config.group.first : 0,
    second:
      predicted.second_team_id === actual.second_team_id ? config.group.second : 0,
    third:
      predicted.third_team_id === actual.third_team_id ? config.group.third : 0,
    fourth:
      predicted.fourth_team_id === actual.fourth_team_id ? config.group.fourth : 0,
    qualifier_bonus: 0,
  }

  // Bônus: para cada time entre o palpite top-3 que de fato classificou aos 32-avos
  const top3Predicted = [
    predicted.first_team_id,
    predicted.second_team_id,
    predicted.third_team_id,
  ]
  breakdown.qualifier_bonus =
    top3Predicted.filter((id) => qualified.has(id)).length *
    config.group.qualifier_bonus_per_team

  const points =
    breakdown.first +
    breakdown.second +
    breakdown.third +
    breakdown.fourth +
    breakdown.qualifier_bonus

  return { points, breakdown }
}

// ----------------------------------------------------------------------------
// Pontuação do torneio (campeão, vice, 3º)
// ----------------------------------------------------------------------------
export interface TournamentBetInput {
  champion_team_id: number
  runner_up_team_id: number
  third_place_team_id: number
}

export interface TournamentResult {
  champion_team_id: number
  runner_up_team_id: number
  third_place_team_id: number
}

export interface TournamentScoreBreakdown {
  champion: number
  runner_up: number
  third_place: number
}

export function scoreTournament(
  predicted: TournamentBetInput,
  actual: TournamentResult,
  config: ScoringConfig = DEFAULT_SCORING,
): { points: number; breakdown: TournamentScoreBreakdown } {
  const breakdown: TournamentScoreBreakdown = {
    champion:
      predicted.champion_team_id === actual.champion_team_id
        ? config.tournament.champion
        : 0,
    runner_up:
      predicted.runner_up_team_id === actual.runner_up_team_id
        ? config.tournament.runner_up
        : 0,
    third_place:
      predicted.third_place_team_id === actual.third_place_team_id
        ? config.tournament.third_place
        : 0,
  }
  return {
    points: breakdown.champion + breakdown.runner_up + breakdown.third_place,
    breakdown,
  }
}

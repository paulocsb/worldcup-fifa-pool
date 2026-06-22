import { describe, expect, it } from 'vitest'
import { DEFAULT_SCORING, outcomeOf, scoreMatch } from './scoring'

describe('outcomeOf', () => {
  it('returns "home" when home goals are higher', () => {
    expect(outcomeOf(3, 1)).toBe('home')
  })

  it('returns "away" when away goals are higher', () => {
    expect(outcomeOf(0, 2)).toBe('away')
  })

  it('returns "draw" on a tie', () => {
    expect(outcomeOf(2, 2)).toBe('draw')
    expect(outcomeOf(0, 0)).toBe('draw')
  })
})

describe('scoreMatch', () => {
  it('awards exact_score (10) when the prediction is exact', () => {
    const result = scoreMatch({
      predicted_home: 2,
      predicted_away: 1,
      actual_home: 2,
      actual_away: 1,
    })
    expect(result.points).toBe(10)
    expect(result.breakdown).toEqual({ exact: 10, result: 0, goal_diff: 0 })
  })

  it('awards correct_result (5) + correct_goal_diff_bonus (2) when result and diff match', () => {
    // predicted 3-1 (home wins by 2), actual 2-0 (home wins by 2)
    const result = scoreMatch({
      predicted_home: 3,
      predicted_away: 1,
      actual_home: 2,
      actual_away: 0,
    })
    expect(result.points).toBe(7)
    expect(result.breakdown).toEqual({ exact: 0, result: 5, goal_diff: 2 })
  })

  it('awards only correct_result (5) when outcome matches but diff differs', () => {
    // predicted 3-1 (diff 2), actual 1-0 (diff 1) — both home wins
    const result = scoreMatch({
      predicted_home: 3,
      predicted_away: 1,
      actual_home: 1,
      actual_away: 0,
    })
    expect(result.points).toBe(5)
    expect(result.breakdown).toEqual({ exact: 0, result: 5, goal_diff: 0 })
  })

  it('awards zero when outcome is wrong', () => {
    // predicted home win, actual away win
    const result = scoreMatch({
      predicted_home: 2,
      predicted_away: 1,
      actual_home: 0,
      actual_away: 3,
    })
    expect(result.points).toBe(0)
    expect(result.breakdown).toEqual({ exact: 0, result: 0, goal_diff: 0 })
  })

  it('handles draw predictions correctly', () => {
    // predicted 1-1, actual 2-2 — both draw, diff 0=0
    const result = scoreMatch({
      predicted_home: 1,
      predicted_away: 1,
      actual_home: 2,
      actual_away: 2,
    })
    // result correct (draw) + diff correct (both 0)
    expect(result.points).toBe(7)
    expect(result.breakdown).toEqual({ exact: 0, result: 5, goal_diff: 2 })
  })

  it('handles 0-0 exact prediction', () => {
    const result = scoreMatch({
      predicted_home: 0,
      predicted_away: 0,
      actual_home: 0,
      actual_away: 0,
    })
    expect(result.points).toBe(10)
    expect(result.breakdown.exact).toBe(10)
  })

  it('respects custom scoring config', () => {
    const custom = {
      ...DEFAULT_SCORING,
      match: { exact_score: 100, correct_result: 50, correct_goal_diff_bonus: 20 },
    }
    const result = scoreMatch(
      { predicted_home: 2, predicted_away: 1, actual_home: 2, actual_away: 1 },
      custom,
    )
    expect(result.points).toBe(100)
  })

  it('does not award goal_diff bonus if outcome is wrong, even when diff coincidentally matches', () => {
    // edge case: predicted 0-1 (diff -1), actual 1-2 (diff -1) — both away wins by 1
    // diff matches AND outcome matches → both bonuses
    const result1 = scoreMatch({
      predicted_home: 0,
      predicted_away: 1,
      actual_home: 1,
      actual_away: 2,
    })
    expect(result1.points).toBe(7) // 5 result + 2 diff

    // edge case: predicted 0-1 (away wins, diff -1), actual 2-1 (home wins, diff +1)
    // diff doesn't match either → 0
    const result2 = scoreMatch({
      predicted_home: 0,
      predicted_away: 1,
      actual_home: 2,
      actual_away: 1,
    })
    expect(result2.points).toBe(0)
  })
})

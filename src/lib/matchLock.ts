import type { Match } from '@/types/db'

export const LOCK_MINUTES_DEFAULT = 5

export function lockTime(match: Pick<Match, 'kickoff_at'>): Date {
  return new Date(
    new Date(match.kickoff_at).getTime() - LOCK_MINUTES_DEFAULT * 60_000,
  )
}

export function isPredictionOpen(
  match: Pick<Match, 'kickoff_at' | 'status'>,
  now: Date = new Date(),
): boolean {
  if (match.status !== 'scheduled') return false
  return lockTime(match).getTime() > now.getTime()
}

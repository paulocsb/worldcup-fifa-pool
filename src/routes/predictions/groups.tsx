import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TeamBadge } from '@/components/TeamBadge'
import { GroupPill } from '@/components/GroupPill'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import {
  ALL_GROUPS,
  useGroupLocks,
  useMyGroupPredictions,
  type GroupLetter,
} from '@/hooks/useGroupPredictions'
import { useTeams } from '@/hooks/useTeams'
import { usePageBackground } from '@/hooks/usePageBackground'
import { groupColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import type { GroupPrediction, Team } from '@/types/db'

export function GroupsIndexPage() {
  const { t } = useTranslation('predictions')
  const auth = useAuth()
  const userId = auth.session?.user.id
  const teams = useTeams()
  const predictions = useMyGroupPredictions(userId)
  const locks = useGroupLocks()
  usePageBackground('group-stage')

  const predictionByGroup = useMemo(() => {
    const map = new Map<string, GroupPrediction>()
    predictions.data?.forEach((p) => map.set(p.group_letter, p))
    return map
  }, [predictions.data])

  const teamsByGroup = useMemo(() => {
    const map = new Map<string, Team[]>()
    teams.data?.forEach((t) => {
      const arr = map.get(t.group_letter) ?? []
      arr.push(t)
      map.set(t.group_letter, arr)
    })
    // Within each group, sort by id — the seed migration inserts teams in
    // Pot 1 → Pot 4 order with sequential ids (101..104 for group A, etc.),
    // so id ASC reproduces FIFA's pot ordering. Falls back gracefully if
    // ids are non-sequential (still a deterministic order).
    for (const arr of map.values()) arr.sort((a, b) => a.id - b.id)
    return map
  }, [teams.data])

  const loading = teams.isPending || predictions.isPending || locks.isPending

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={t('groups.pageTitle')}
        subtitle={t('groups.pageSubtitle')}
        backTo="/"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="space-y-3">
          {ALL_GROUPS.map((letter: GroupLetter) => {
            const isOpen = locks.data?.[letter] ?? false
            const myPred = predictionByGroup.get(letter)
            const grpTeams = teamsByGroup.get(letter) ?? []
            const status = !isOpen
              ? 'locked'
              : myPred
                ? 'saved'
                : 'pending'

            const token = groupColorToken(letter)
            const accentStyle = token
              ? ({ '--accent-c': `hsl(var(--${token}))` } as React.CSSProperties)
              : undefined

            return (
              <li key={letter}>
                <Link
                  to={`/predictions/groups/${letter}`}
                  style={accentStyle}
                  className="relative block overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 active:scale-[0.99] hover:[border-color:var(--accent-c)]/60"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1 [background-color:var(--accent-c)]"
                  />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <GroupPill letter={letter} size="md" withLabel />
                    <StatusBadge status={status} />
                  </div>
                  {myPred ? (
                    <PredictedOrder pred={myPred} teams={grpTeams} />
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {grpTeams.map((t) => (
                        <li key={t.id} className="py-1.5">
                          <TeamBadge team={t} size="sm" />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {myPred
                        ? isOpen
                          ? t('groups.footerEdit')
                          : t('groups.footerSavedLocked')
                        : isOpen
                          ? t('groups.footerOpenEmpty')
                          : t('groups.footerLockedEmpty')}
                    </span>
                    <ArrowRight className="size-4" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * Renders the 4 teams in the order the user predicted (1º → 4º), with
 * positional tint: top 2 in primary (qualify direct), 3rd in amber (best
 * 3rds zone), 4th neutral.
 */
function PredictedOrder({
  pred,
  teams,
}: {
  pred: GroupPrediction
  teams: Team[]
}) {
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const ordered = [
    pred.first_team_id,
    pred.second_team_id,
    pred.third_team_id,
    pred.fourth_team_id,
  ]
  return (
    <ol className="space-y-1">
      {ordered.map((teamId, i) => {
        const team = teamById.get(teamId)
        if (!team) return null
        const position = i + 1
        const tone =
          position <= 2
            ? 'border-l-2 border-l-primary/70 bg-primary/[0.04]'
            : position === 3
              ? 'border-l-2 border-l-amber-500/60 bg-amber-500/[0.05]'
              : 'border-l-2 border-l-transparent'
        return (
          <li
            key={team.id}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5',
              tone,
            )}
          >
            <span className="font-display w-4 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">
              {position}
            </span>
            <TeamBadge team={team} size="sm" />
          </li>
        )
      })}
    </ol>
  )
}

function StatusBadge({
  status,
}: {
  status: 'saved' | 'pending' | 'locked'
}) {
  const { t } = useTranslation('predictions')
  if (status === 'saved')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        <CheckCircle2 className="size-3" />
        {t('groups.statusSaved')}
      </span>
    )
  if (status === 'locked')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Lock className="size-3" />
        {t('groups.statusLocked')}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      <Clock3 className="size-3" />
      {t('groups.statusPending')}
    </span>
  )
}

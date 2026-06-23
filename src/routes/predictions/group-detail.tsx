import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TeamSelect } from '@/components/TeamSelect'
import { GroupPill } from '@/components/GroupPill'
import { groupColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  ALL_GROUPS,
  useGroupLocks,
  useMyGroupPredictions,
  useUpsertGroupPrediction,
  type GroupLetter,
} from '@/hooks/useGroupPredictions'
import { useTeams } from '@/hooks/useTeams'

const POSITION_LABELS_SHORT = ['1º', '2º', '3º', '4º']
const POSITION_POINTS = [5, 5, 3, 2]

export function GroupDetailPage() {
  const params = useParams<{ letter: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('predictions')
  const { t: tCommon } = useTranslation('common')
  const POSITION_LABELS = t('groupDetail.positionLabels', {
    returnObjects: true,
  }) as string[]
  const letterParam = (params.letter ?? '').toUpperCase()
  const letter = ALL_GROUPS.includes(letterParam as GroupLetter)
    ? (letterParam as GroupLetter)
    : null

  // Mirror PageHeader: pop history when available so the back button doesn't
  // push a fresh entry to /predictions/groups (which would create a navigation
  // loop with the PageHeader's own navigate(-1)).
  function handleBack() {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/predictions/groups', { replace: true })
    }
  }

  const auth = useAuth()
  const userId = auth.session?.user.id
  const teams = useTeams()
  const predictions = useMyGroupPredictions(userId)
  const locks = useGroupLocks()
  const mutation = useUpsertGroupPrediction(userId)

  const [first, setFirst] = useState<number | null>(null)
  const [second, setSecond] = useState<number | null>(null)
  const [third, setThird] = useState<number | null>(null)
  const [fourth, setFourth] = useState<number | null>(null)

  const current = useMemo(
    () => predictions.data?.find((p) => p.group_letter === letter) ?? null,
    [predictions.data, letter],
  )

  // Hydrate from server only on first load per group letter. Without this
  // guard, any refetch (window focus, realtime invalidation, staleTime tick)
  // would overwrite user edits in flight — making the dropdowns feel
  // uneditable. The ref resets when the letter param changes so navigating
  // to a different group reads from the server again.
  const hydratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (current && hydratedFor.current !== letter) {
      setFirst(current.first_team_id)
      setSecond(current.second_team_id)
      setThird(current.third_team_id)
      setFourth(current.fourth_team_id)
      hydratedFor.current = letter
    }
  }, [current, letter])

  if (!letter) return <Navigate to="/predictions/groups" replace />

  const token = groupColorToken(letter)
  const accentStyle = token
    ? ({ '--accent-c': `hsl(var(--${token}))` } as React.CSSProperties)
    : undefined

  const groupTeams = teams.data?.filter((t) => t.group_letter === letter) ?? []
  const isOpen = locks.data?.[letter] ?? false
  const positions: Array<[number | null, (v: number | null) => void]> = [
    [first, setFirst],
    [second, setSecond],
    [third, setThird],
    [fourth, setFourth],
  ]
  const allFilled = positions.every(([v]) => v !== null)
  const allDistinct = new Set(positions.map(([v]) => v)).size === 4

  // Position label (1º / 2º / 3º / 4º) for a team currently assigned to a
  // slot other than `excludeIdx`. Used to show "em 2º" inside the dropdown.
  function slotLabelOfTeam(teamId: number, excludeIdx: number): string | null {
    const idx = positions.findIndex(
      ([v], i) => i !== excludeIdx && v === teamId,
    )
    return idx >= 0 ? POSITION_LABELS_SHORT[idx] : null
  }

  // Set a team at a position. If the team is already at another position,
  // swap: that other position takes whatever was previously at `idx` (which
  // may be null), so the user never gets stuck.
  function setAtPosition(idx: number, teamId: number) {
    const currentAtIdx = positions[idx][0]
    const otherIdx = positions.findIndex(
      ([v], i) => i !== idx && v === teamId,
    )
    if (otherIdx >= 0) {
      positions[otherIdx][1](currentAtIdx)
    }
    positions[idx][1](teamId)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allFilled || !allDistinct || !letter) return
    await mutation.mutateAsync({
      group_letter: letter,
      first_team_id: first!,
      second_team_id: second!,
      third_team_id: third!,
      fourth_team_id: fourth!,
    })
  }

  const loading = teams.isPending || predictions.isPending || locks.isPending

  return (
    <section style={accentStyle} className="container space-y-5 py-4">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-[color:var(--accent-c)]/10 p-4">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 [background-color:var(--accent-c)]"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={tCommon('back')}
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
                Grupo {letter}
              </h1>
              <GroupPill letter={letter} size="sm" withLabel={false} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('groupDetail.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {!isOpen && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="size-4 shrink-0" />
          <span>{t('groupDetail.lockedNotice')}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {positions.map(([value], idx) => {
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold">
                    {POSITION_LABELS[idx]}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {t('groupDetail.pointsIfRight', {
                      count: POSITION_POINTS[idx],
                    })}
                  </span>
                </div>
                <TeamSelect
                  teams={groupTeams}
                  value={value}
                  onChange={(id) => setAtPosition(idx, id)}
                  assignedAtLabel={(tid) => slotLabelOfTeam(tid, idx)}
                  placeholder={t('groupDetail.openTeamSelect', {
                    label: POSITION_LABELS_SHORT[idx],
                  })}
                  disabled={!isOpen}
                />
              </div>
            )
          })}

          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {(mutation.error as Error).message}
            </p>
          )}
          {mutation.isSuccess && !mutation.isPending && (
            <p
              className="flex items-center gap-2 text-sm text-primary"
              role="status"
            >
              <CheckCircle2 className="size-4" />
              {t('groupDetail.saved')}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className={cn(
              'w-full transition-all duration-300',
              isOpen &&
                allFilled &&
                allDistinct &&
                !mutation.isPending &&
                'glow-primary',
            )}
            disabled={
              !isOpen || !allFilled || !allDistinct || mutation.isPending
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" /> {t('groupDetail.submitting')}
              </>
            ) : (
              t('groupDetail.submit')
            )}
          </Button>
        </form>
      )}
    </section>
  )
}

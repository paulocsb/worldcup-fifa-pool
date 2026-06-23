import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PositionBadge } from '@/components/PositionBadge'
import { TeamSelect } from '@/components/TeamSelect'
import { usePageBackground } from '@/hooks/usePageBackground'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTeams, useTournamentLockOpen } from '@/hooks/useTeams'
import {
  useTournamentPrediction,
  useUpsertTournamentPrediction,
} from '@/hooks/useTournamentPrediction'
import type { Team } from '@/types/db'

export function TournamentPredictionPage() {
  const { t } = useTranslation('predictions')
  const auth = useAuth()
  const userId = auth.session?.user.id
  const teams = useTeams()
  const lock = useTournamentLockOpen()
  const current = useTournamentPrediction(userId)
  const mutation = useUpsertTournamentPrediction(userId)
  usePageBackground('final')

  const [champion, setChampion] = useState<number | null>(null)
  const [runnerUp, setRunnerUp] = useState<number | null>(null)
  const [third, setThird] = useState<number | null>(null)

  // Hydrate from server only on first load. Without this guard, any refetch
  // (window focus, realtime invalidation, staleTime tick) would overwrite
  // user edits in flight, making the dropdowns feel uneditable.
  const hydrated = useRef(false)
  useEffect(() => {
    if (current.data && !hydrated.current) {
      setChampion(current.data.champion_team_id)
      setRunnerUp(current.data.runner_up_team_id)
      setThird(current.data.third_place_team_id)
      hydrated.current = true
    }
  }, [current.data])

  const isOpen = lock.data?.open ?? false
  const allFilled = champion && runnerUp && third
  const distinct =
    champion !== runnerUp && champion !== third && runnerUp !== third

  // Tournament slot semantics: champion / runner-up / 3rd. Picking a team
  // that's already in another slot swaps the two — same UX as group-detail.
  const slots: Array<{
    label: string
    value: number | null
    set: (v: number | null) => void
  }> = [
    { label: t('tournament.champion'), value: champion, set: setChampion },
    { label: t('tournament.runnerUp'), value: runnerUp, set: setRunnerUp },
    { label: t('tournament.thirdPlace'), value: third, set: setThird },
  ]
  function slotLabelOfTeam(teamId: number, excludeIdx: number): string | null {
    const idx = slots.findIndex(
      (s, i) => i !== excludeIdx && s.value === teamId,
    )
    return idx >= 0 ? slots[idx].label : null
  }
  function setAtSlot(idx: number, teamId: number) {
    const currentAtIdx = slots[idx].value
    const otherIdx = slots.findIndex(
      (s, i) => i !== idx && s.value === teamId,
    )
    if (otherIdx >= 0) slots[otherIdx].set(currentAtIdx)
    slots[idx].set(teamId)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allFilled || !distinct) return
    await mutation.mutateAsync({
      champion_team_id: champion!,
      runner_up_team_id: runnerUp!,
      third_place_team_id: third!,
    })
  }

  const loading = teams.isPending || lock.isPending || current.isPending

  return (
    <section className="container space-y-6 py-4">
      <PageHeader
        title={t('tournament.pageTitle')}
        subtitle={t('tournament.pageSubtitle')}
        backTo="/"
        accent="gold"
        trailing={
          <Link
            to="/regras"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-3" />
            {t('tournament.rulesLink')}
          </Link>
        }
      />

      {!isOpen && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="size-4 shrink-0" />
          <span>{t('tournament.lockClosed')}</span>
        </div>
      )}

      {isOpen && lock.data && (
        <p className="text-xs text-muted-foreground">
          {t('tournament.lockOpenHint', {
            count: lock.data.remaining_group_matches,
          })}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Slot
            icon={
              <PositionBadge position="gold" variant="icon-only" size="lg" />
            }
            label={t('tournament.champion')}
            sublabel={t('tournament.championSubtitle')}
            teams={teams.data ?? []}
            value={champion}
            onChange={(id) => setAtSlot(0, id)}
            assignedAtLabel={(tid) => slotLabelOfTeam(tid, 0)}
            disabled={!isOpen}
          />
          <Slot
            icon={
              <PositionBadge position="silver" variant="icon-only" size="lg" />
            }
            label={t('tournament.runnerUp')}
            sublabel={t('tournament.runnerUpSubtitle')}
            teams={teams.data ?? []}
            value={runnerUp}
            onChange={(id) => setAtSlot(1, id)}
            assignedAtLabel={(tid) => slotLabelOfTeam(tid, 1)}
            disabled={!isOpen}
          />
          <Slot
            icon={
              <PositionBadge position="bronze" variant="icon-only" size="lg" />
            }
            label={t('tournament.thirdPlace')}
            sublabel={t('tournament.thirdPlaceSubtitle')}
            teams={teams.data ?? []}
            value={third}
            onChange={(id) => setAtSlot(2, id)}
            assignedAtLabel={(tid) => slotLabelOfTeam(tid, 2)}
            disabled={!isOpen}
          />

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
              {t('tournament.saved')}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className={cn(
              'w-full transition-all duration-300',
              isOpen && allFilled && distinct && !mutation.isPending && 'glow-gold',
            )}
            disabled={!isOpen || !allFilled || !distinct || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" /> {t('tournament.submitting')}
              </>
            ) : (
              t('tournament.submit')
            )}
          </Button>
        </form>
      )}
    </section>
  )
}

interface SlotProps {
  icon: React.ReactNode
  label: string
  sublabel: string
  teams: Team[]
  value: number | null
  onChange: (id: number) => void
  assignedAtLabel: (teamId: number) => string | null
  disabled?: boolean
}

function Slot({
  icon,
  label,
  sublabel,
  teams,
  value,
  onChange,
  assignedAtLabel,
  disabled,
}: SlotProps) {
  const { t } = useTranslation('predictions')
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
      </div>
      <TeamSelect
        teams={teams}
        value={value}
        onChange={onChange}
        assignedAtLabel={assignedAtLabel}
        placeholder={t('tournament.chooseLowercase', {
          label: label.toLowerCase(),
        })}
        disabled={disabled}
      />
    </div>
  )
}

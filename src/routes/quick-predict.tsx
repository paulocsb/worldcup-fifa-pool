import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  SkipForward,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupPill } from '@/components/GroupPill'
import { PageHeader } from '@/components/PageHeader'
import { PhasePill } from '@/components/PhasePill'
import { TeamFlag } from '@/components/TeamFlag'
import { useAuth } from '@/hooks/useAuth'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import {
  useMyPredictions,
  useUpsertPrediction,
} from '@/hooks/usePredictions'
import { isPredictionOpen } from '@/lib/matchLock'
import { kickoffLabel } from '@/lib/format'
import { useTeamName } from '@/lib/teamI18n'
import { venueLabel } from '@/lib/venueCountry'
import { cn } from '@/lib/utils'

const QUICK_PRESETS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [2, 1],
  [1, 1],
  [2, 0],
]

interface ScoreInputProps {
  label: string
  value: number
  onChange: (n: number) => void
}

function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <div className="font-display text-4xl font-black tabular-nums leading-none">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

function TeamColumn({
  team,
  align,
}: {
  team: MatchWithTeams['home_team']
  align: 'left' | 'right'
}) {
  const name = useTeamName(team)
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 text-center',
        align === 'left' ? 'text-left' : 'text-right',
      )}
    >
      <TeamFlag team={team} size={56} />
      <div className="min-w-0">
        <div className="font-display text-xl font-black uppercase leading-none tracking-tight">
          {team?.code ?? '—'}
        </div>
        {team && (
          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            {name}
          </div>
        )}
      </div>
    </div>
  )
}

export function QuickPredictPage() {
  const auth = useAuth()
  const userId = auth.session?.user.id
  const matches = useMatches()
  const predictions = useMyPredictions(userId)
  const upsert = useUpsertPrediction(userId)
  const navigate = useNavigate()
  const { t } = useTranslation('predictions')
  const { t: tCommon } = useTranslation('common')

  // Snapshot da lista no mount: jogos abertos sem palpite ainda
  const [queue, setQueue] = useState<MatchWithTeams[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (queue !== null) return
    if (matches.isPending || predictions.isPending) return
    if (!matches.data || !predictions.data) return
    const predictedSet = new Set(predictions.data.map((p) => p.match_id))
    const filtered = matches.data.filter(
      (m) => isPredictionOpen(m) && !predictedSet.has(m.id),
    )
    setQueue(filtered)
  }, [
    queue,
    matches.isPending,
    matches.data,
    predictions.isPending,
    predictions.data,
  ])

  // Quando muda de match, reseta scores e dispara animação
  useEffect(() => {
    setHome(0)
    setAway(0)
    setAnimKey((k) => k + 1)
    upsert.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  if (queue === null) {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  const total = queue.length

  if (total === 0) {
    return <AllDoneScreen total={0} />
  }

  if (idx >= total) {
    return <AllDoneScreen total={total} />
  }

  const current = queue[idx]
  const progressPct = ((idx + 1) / total) * 100

  async function handleSaveAndNext() {
    try {
      await upsert.mutateAsync({
        match_id: current.id,
        home_score: home,
        away_score: away,
      })
      setIdx((i) => i + 1)
    } catch {
      // erro fica em upsert.error; UI mostra
    }
  }

  function handleSkip() {
    setIdx((i) => i + 1)
  }

  function handleBack() {
    if (idx > 0) setIdx((i) => i - 1)
  }

  return (
    <section className="container space-y-5 py-4">
      {/* Top: progresso + close */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label={t('quickPredict.exitAria')}
            className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <span className="font-display text-base font-bold uppercase tabular-nums tracking-wider">
            {idx + 1} / {total}
          </span>
          <div className="w-10" />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Match card animado por key={animKey} */}
      <div key={animKey} className="animate-float-in space-y-5">
        <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            {current.group_letter ? (
              <GroupPill letter={current.group_letter} size="md" withLabel />
            ) : (
              <PhasePill stage={current.stage} size="md" />
            )}
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {kickoffLabel(current.kickoff_at)}
            </span>
          </div>
          {(current.venue || current.venue_city) && (
            <p className="mb-4 text-[11px] text-muted-foreground">
              {venueLabel(current.venue, current.venue_city)}
            </p>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TeamColumn team={current.home_team} align="left" />
            <span className="font-display text-2xl font-bold leading-none text-muted-foreground/60">
              ×
            </span>
            <TeamColumn team={current.away_team} align="right" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <ScoreInput
              label={t('quickPredict.homeLabel')}
              value={home}
              onChange={setHome}
            />
            <ScoreInput
              label={t('quickPredict.awayLabel')}
              value={away}
              onChange={setAway}
            />
          </div>
        </div>

        {/* Atalhos de placar */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('quickPredict.scoreShortcuts')}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map(([h, a]) => {
              const active = home === h && away === a
              return (
                <button
                  key={`${h}-${a}`}
                  type="button"
                  onClick={() => {
                    setHome(h)
                    setAway(a)
                  }}
                  className={cn(
                    'font-display rounded-full border px-4 py-1.5 text-base font-black uppercase tabular-nums tracking-wider transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-accent',
                  )}
                >
                  {h}–{a}
                </button>
              )
            })}
          </div>
        </div>

        {upsert.isError && (
          <p className="text-sm text-destructive" role="alert">
            {(upsert.error as Error).message}
          </p>
        )}

        {/* Ações */}
        <div className="grid grid-cols-[auto_auto_1fr] gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={idx === 0 || upsert.isPending}
            aria-label={tCommon('back')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSkip}
            disabled={upsert.isPending}
          >
            <SkipForward className="size-4" />
            {t('quickPredict.skip')}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSaveAndNext}
            disabled={upsert.isPending}
            className="glow-primary"
          >
            {upsert.isPending ? (
              <>
                <Loader2 className="animate-spin" /> {t('quickPredict.saving')}
              </>
            ) : (
              <>
                {t('quickPredict.save')}
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}

function AllDoneScreen({ total }: { total: number }) {
  const { t } = useTranslation('predictions')
  return (
    <section className="container flex min-h-svh flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-10" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          {t('quickPredict.allDoneTitle')}
        </h1>
        <p className="max-w-sm text-balance text-muted-foreground">
          {total === 0
            ? t('quickPredict.allDoneEmpty')
            : t('quickPredict.allDoneCount', { count: total })}
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95"
      >
        {t('quickPredict.backToHome')}
      </Link>
    </section>
  )
}

/** Helper exportado pra Home computar o card "X palpites pendentes" */
export function useOpenPendingMatchesCount() {
  const auth = useAuth()
  const userId = auth.session?.user.id
  const matches = useMatches()
  const predictions = useMyPredictions(userId)

  return useMemo(() => {
    if (!matches.data || !predictions.data) return 0
    const predictedSet = new Set(predictions.data.map((p) => p.match_id))
    return matches.data.filter(
      (m) => isPredictionOpen(m) && !predictedSet.has(m.id),
    ).length
  }, [matches.data, predictions.data])
}

void PageHeader // mantém import (header customizado por enquanto; PageHeader pode ser usado se quiser uniformizar)

import { useMemo, useState } from 'react'
import { Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MatchCard } from '@/components/MatchCard'
import { MatchCardSkeleton } from '@/components/MatchCardSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { PredictionSheet } from '@/components/PredictionSheet'
import { SectionHeader } from '@/components/SectionHeader'
import { useAuth } from '@/hooks/useAuth'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useMyScores } from '@/hooks/useMyScores'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { dateKey, sectionDateLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Prediction } from '@/types/db'

type Filter = 'upcoming' | 'today' | 'finished' | 'all'

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function MatchesPage() {
  const { t } = useTranslation('matches')
  const filterLabels: Record<Filter, string> = {
    upcoming: t('filters.upcoming'),
    today: t('filters.today'),
    finished: t('filters.finished'),
    all: t('filters.all'),
  }
  const auth = useAuth()
  const userId = auth.session?.user.id
  const matches = useMatches()
  const predictions = useMyPredictions(userId)
  const scores = useMyScores(userId)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  useRealtimeInvalidator({
    tables: ['matches', 'scores'],
    queryKeys: [['matches'], ['my-scores', userId]],
  })

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  // Aplica filtro escolhido
  const filtered = useMemo(() => {
    const all = matches.data ?? []
    const now = new Date()
    if (filter === 'all') return all
    if (filter === 'today')
      return all.filter((m) => isSameDay(new Date(m.kickoff_at), now))
    if (filter === 'finished') return all.filter((m) => m.status === 'finished')
    return all.filter((m) => m.status === 'scheduled' || m.status === 'live')
  }, [matches.data, filter])

  // Separa LIVE do resto e agrupa por dia
  const { live, groupedByDate } = useMemo(() => {
    const live: MatchWithTeams[] = []
    const others: MatchWithTeams[] = []
    for (const m of filtered) {
      if (m.status === 'live') live.push(m)
      else others.push(m)
    }
    // Agrupa preservando ordem original (já vem por kickoff_at)
    const groups = new Map<string, { label: string; matches: MatchWithTeams[] }>()
    for (const m of others) {
      const key = dateKey(m.kickoff_at)
      const bucket = groups.get(key) ?? {
        label: sectionDateLabel(m.kickoff_at),
        matches: [],
      }
      bucket.matches.push(m)
      groups.set(key, bucket)
    }
    return {
      live,
      groupedByDate: Array.from(groups.entries()).map(([key, value]) => ({
        key,
        ...value,
      })),
    }
  }, [filtered])

  return (
    <section className="container space-y-4 py-4">
      <PageHeader title={t('pageTitle')} />

      <nav role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {filterLabels[f]}
            </button>
          ))}
      </nav>

      {matches.isPending ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <MatchCardSkeleton />
            </li>
          ))}
        </ul>
      ) : matches.isError ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {t('loadError', { message: (matches.error as Error).message })}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t('noneMatching')}
        </p>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <section className="space-y-3">
              <SectionHeader
                title={t('liveNow')}
                tone="destructive"
                icon={<Radio className="size-4" />}
              />
              <ul className="space-y-3">
                {live.map((m) => (
                  <li key={m.id}>
                    <MatchCard
                      match={m}
                      prediction={predictionByMatch.get(m.id)}
                      score={scores.data?.byMatch.get(m.id) ?? null}
                      onPredict={setActive}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {groupedByDate.map(({ key, label, matches: dayMatches }) => (
            <section key={key} className="space-y-3">
              <SectionHeader
                title={label}
                trailing={t('matchesCount', { count: dayMatches.length })}
                sticky
              />
              <ul className="space-y-3">
                {dayMatches.map((m) => (
                  <li key={m.id}>
                    <MatchCard
                      match={m}
                      prediction={predictionByMatch.get(m.id)}
                      score={scores.data?.byMatch.get(m.id) ?? null}
                      onPredict={setActive}
                      compactTime
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={userId}
        onClose={() => setActive(null)}
      />
    </section>
  )
}


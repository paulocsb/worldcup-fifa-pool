import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MatchStage, Prediction } from '@/types/db'
import { MatchCard } from './MatchCard'
import { MatchCardSkeleton } from './MatchCardSkeleton'
import { PredictionSheet } from './PredictionSheet'
import { PhasePill } from './PhasePill'
import { SectionHeader } from './SectionHeader'
import { Surface } from './Surface'
import { useAuth } from '@/hooks/useAuth'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { dateKey, sectionDateLabel } from '@/lib/format'
import type { TabSlug } from '@/lib/tournamentPhase'
import { emptyStateForTab } from '@/lib/tournamentPhase'
import { venueLabel } from '@/lib/venueCountry'

interface BracketPhaseProps {
  /** Stages incluídos nesta tab (ex: ['third_place', 'final']) */
  stages: ReadonlyArray<MatchStage>
  /** Slug usado pra empty state message */
  slug: TabSlug
}

/**
 * Renderiza a lista de jogos de uma fase de mata-mata.
 *
 * - Matches com home_team e away_team definidos → MatchCard normal
 * - Matches com algum time null → PlaceholderCard
 * - Sem matches no banco → empty state
 */
export function BracketPhase({ stages, slug }: BracketPhaseProps) {
  const { t } = useTranslation('matches')
  const auth = useAuth()
  const matches = useMatches()
  const predictions = useMyPredictions(auth.session?.user.id)
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  useRealtimeInvalidator({
    tables: ['matches'],
    queryKeys: [['matches']],
  })

  const phaseMatches = useMemo(() => {
    return (matches.data ?? []).filter((m) => stages.includes(m.stage))
  }, [matches.data, stages])

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  // Agrupa por dia (preservando ordem por kickoff_at vinda do hook)
  const groupedByDate = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; matches: MatchWithTeams[] }
    >()
    for (const m of phaseMatches) {
      const key = dateKey(m.kickoff_at)
      const bucket = groups.get(key) ?? {
        label: sectionDateLabel(m.kickoff_at),
        matches: [],
      }
      bucket.matches.push(m)
      groups.set(key, bucket)
    }
    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      ...value,
    }))
  }, [phaseMatches])

  if (matches.isPending) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <MatchCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (matches.isError) {
    return (
      <Surface
        variant="notice"
        tone="destructive"
        as="p"
        className="text-sm"
        role="alert"
        aria-live="polite"
      >
        Erro ao carregar jogos: {(matches.error as Error).message}
      </Surface>
    )
  }

  if (phaseMatches.length === 0) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        className="animate-float-in flex flex-col items-center gap-3 p-8 text-center"
      >
        <Loader2 className="size-6 text-muted-foreground/60" />
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          {emptyStateForTab(slug)}
        </p>
      </Surface>
    )
  }

  return (
    <>
      <div className="space-y-6">
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
                  {m.home_team && m.away_team ? (
                    <MatchCard
                      match={m}
                      prediction={predictionByMatch.get(m.id)}
                      onPredict={setActive}
                    />
                  ) : (
                    <PlaceholderCard match={m} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={auth.session?.user.id}
        onClose={() => setActive(null)}
      />
    </>
  )
}

/**
 * Card pra jogo cujo chaveamento ainda não definiu os times.
 * Ex: 32-avos antes da fase de grupos terminar.
 */
function PlaceholderCard({ match }: { match: MatchWithTeams }) {
  const { t, i18n } = useTranslation('standings')
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR'
  const date = new Date(match.kickoff_at)
  const dateLabel = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  })
  const timeLabel = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Surface
      as="article"
      variant="dashed"
      className="animate-float-in relative overflow-hidden"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <PhasePill stage={match.stage} size="md" variant="tinted" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {dateLabel} · {timeLabel}
        </span>
      </header>

      {(match.venue || match.venue_city) && (
        <div className="mb-3 truncate text-[11px] text-muted-foreground">
          {venueLabel(match.venue, match.venue_city)}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 py-3 text-sm text-muted-foreground">
        <span className="font-display text-base font-bold uppercase tracking-wider">
          {t('bracket.tba')}
        </span>
        <span className="text-muted-foreground/40">×</span>
        <span className="font-display text-base font-bold uppercase tracking-wider">
          {t('bracket.tba')}
        </span>
      </div>
    </Surface>
  )
}

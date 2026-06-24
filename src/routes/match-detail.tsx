import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FifaLogo } from '@/components/FifaLogo'
import { TeamFlag } from '@/components/TeamFlag'
import { AnimatedScore } from '@/components/AnimatedScore'
import { PageHeader } from '@/components/PageHeader'
import { MatchEvents } from '@/components/match/MatchEvents'
import { MatchLineups } from '@/components/match/MatchLineups'
import { MatchStatistics } from '@/components/match/MatchStatistics'
import { MatchTimer } from '@/components/match/MatchTimer'
import {
  useMatchDetail,
  useTriggerMatchDetailSync,
} from '@/hooks/useMatchDetail'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { usePageBackground, type PageTheme } from '@/hooks/usePageBackground'
import { PHASE_LABEL_PT } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import { kickoffLabel } from '@/lib/format'
import { venueLabel } from '@/lib/venueCountry'
import { useTeamName } from '@/lib/teamI18n'
import type { Team } from '@/types/db'

function ScoreboardTeam({
  team,
  dimmed = false,
}: {
  team: Team | null
  dimmed?: boolean
}) {
  const name = useTeamName(team)
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 text-center transition-opacity',
        dimmed && 'opacity-60',
      )}
    >
      <TeamFlag team={team} size={64} />
      <div className="min-w-0">
        <div
          className={cn(
            'font-display truncate text-2xl font-black uppercase leading-none tracking-tight',
            dimmed && 'text-muted-foreground',
          )}
        >
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

type Tab = 'events' | 'lineups' | 'stats'

const TAB_I18N_KEYS: Record<Tab, string> = {
  events: 'detail.tabs.events',
  lineups: 'detail.tabs.lineups',
  stats: 'detail.tabs.stats',
}

export function MatchDetailPage() {
  const params = useParams<{ id: string }>()
  const matchId = params.id ? Number(params.id) : null
  const [tab, setTab] = useState<Tab>('events')
  const { t } = useTranslation('matches')
  const { t: tCommon } = useTranslation('common')

  const detail = useMatchDetail(matchId)
  useTriggerMatchDetailSync(matchId)
  useRealtimeInvalidator({
    tables: ['matches'],
    queryKeys: [['match-detail', matchId]],
  })

  const stage = detail.data?.stage
  const pageTheme: PageTheme =
    stage === 'final' || stage === 'third_place'
      ? 'final'
      : stage && stage !== 'group'
        ? 'knockouts'
        : 'default'
  usePageBackground(pageTheme)

  if (matchId == null || Number.isNaN(matchId))
    return <Navigate to="/matches" replace />

  if (detail.isPending) {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }
  if (detail.isError || !detail.data) {
    return (
      <main className="container py-8 text-center">
        <p className="text-sm text-destructive">
          {detail.isError
            ? (detail.error as Error).message
            : 'Partida não encontrada.'}
        </p>
        <Link
          to="/matches"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar
        </Link>
      </main>
    )
  }

  const m = detail.data
  const showScore = m.status === 'finished' || m.status === 'live'

  // Vencedor real: em mata-mata decidido nos pênaltis o tempo normal
  // (home_score/away_score) costuma estar empatado, então quem vence é quem tem
  // mais pênaltis. Sem pênaltis, decide o placar do tempo normal/prorrogação.
  // Mesma abordagem inline do MatchCard (ResultScoreboard) para consistência.
  const homePens = m.home_score_penalties
  const awayPens = m.away_score_penalties
  const decidedByPenalties = homePens != null && awayPens != null
  const homeScore = m.home_score ?? 0
  const awayScore = m.away_score ?? 0
  const homeWins = showScore
    ? decidedByPenalties
      ? homePens > awayPens
      : homeScore > awayScore
    : false
  const awayWins = showScore
    ? decidedByPenalties
      ? awayPens > homePens
      : awayScore > homeScore
    : false

  const headerTitle =
    m.stage === 'group' && m.group_letter
      ? `${tCommon('group')} ${m.group_letter}`
      : PHASE_LABEL_PT[m.stage]
  const venueText = venueLabel(m.venue, m.venue_city)
  const headerSubtitle = `${kickoffLabel(m.kickoff_at)}${
    venueText ? ` · ${venueText}` : ''
  }`
  const headerAccent: 'primary' | 'gold' =
    m.stage === 'final' || m.stage === 'third_place' ? 'gold' : 'primary'

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        backTo="/matches"
        accent={headerAccent}
      />

      {(m.stage === 'final' || m.stage === 'third_place') && (
        <div className="relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-phase-final/15 p-3 text-xs font-bold uppercase tracking-wider text-phase-final ring-1 ring-phase-final/40">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-phase-final"
          />
          <FifaLogo size={28} variant="horizontal" />
          <span>
            {m.stage === 'final'
              ? t('detail.finalRibbon')
              : t('detail.thirdPlaceRibbon')}
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {(m.status === 'live' || m.status === 'finished') && (
          <div className="mb-3 flex justify-center">
            <MatchTimer match={m} />
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ScoreboardTeam team={m.home_team} dimmed={awayWins} />
          <div className="px-1 text-center">
            {showScore ? (
              <span className="inline-flex items-baseline gap-1 font-display text-5xl font-black leading-none tracking-tight tabular-nums">
                <AnimatedScore
                  value={homeScore}
                  className={homeWins ? 'text-primary' : undefined}
                />
                <span className="text-muted-foreground/60">–</span>
                <AnimatedScore
                  value={awayScore}
                  className={awayWins ? 'text-primary' : undefined}
                />
              </span>
            ) : (
              <span className="font-display text-xl font-bold uppercase text-muted-foreground">
                vs
              </span>
            )}
          </div>
          <ScoreboardTeam team={m.away_team} dimmed={homeWins} />
        </div>

        {/* Sub-linha de pênaltis: "H–A nos pênaltis" (Fase 4, mesma chave i18n
            do MatchCard). Só quando ambos os campos são não-nulos. Secundária ao
            placar 5xl acima; números destacados, muted, compacta a 320px. */}
        {decidedByPenalties && (
          <p className="mt-2.5 text-center text-xs font-medium text-muted-foreground">
            <span className="tabular-nums text-foreground/80">
              {t('prediction.penalties', { home: homePens, away: awayPens })}
            </span>
          </p>
        )}
      </div>

      <nav
        role="tablist"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4"
      >
        {(Object.keys(TAB_I18N_KEYS) as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={tab === tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'relative whitespace-nowrap px-4 pb-2.5 pt-1.5 text-sm font-medium transition-colors',
              tab === tabKey
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(TAB_I18N_KEYS[tabKey])}
            {tab === tabKey && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary animate-float-in"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {tab === 'events' && (
          <MatchEvents
            events={m.events_parsed ?? []}
            homeTeamId={m.home_team_id}
          />
        )}
        {tab === 'lineups' && (
          <MatchLineups lineups={m.lineups_parsed ?? []} />
        )}
        {tab === 'stats' && (
          <MatchStatistics statistics={m.statistics_parsed ?? []} />
        )}
      </div>
    </section>
  )
}

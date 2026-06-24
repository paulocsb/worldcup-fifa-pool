import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarX,
  Crown,
  LayoutGrid,
  RefreshCw,
  Radio,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOpenPendingMatchesCount } from '@/routes/quick-predict'
import { Avatar } from '@/components/Avatar'
import { FifaLogo } from '@/components/FifaLogo'
import { MatchCard } from '@/components/MatchCard'
import { MatchCardSkeleton } from '@/components/MatchCardSkeleton'
import { MetricCard } from '@/components/MetricCard'
import { MetricGridSkeleton } from '@/components/MetricCardSkeleton'
import { PredictionSheet } from '@/components/PredictionSheet'
import { SectionHeader } from '@/components/SectionHeader'
import { TeamFlag } from '@/components/TeamFlag'
import { useAuth } from '@/hooks/useAuth'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useMyScores } from '@/hooks/useMyScores'
import { useProfile } from '@/hooks/useProfile'
import { useRanking } from '@/hooks/useRanking'
import { useTeams, useTournamentLockOpen } from '@/hooks/useTeams'
import { useTournamentPrediction } from '@/hooks/useTournamentPrediction'
import { useUserStats } from '@/hooks/useUserStats'
import {
  ALL_GROUPS,
  useGroupLocks,
  useMyGroupPredictions,
} from '@/hooks/useGroupPredictions'
import type { AvatarStyle } from '@/lib/dicebear'
import { useTeamName } from '@/lib/teamI18n'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import type { Prediction } from '@/types/db'

export function HomePage() {
  const auth = useAuth()
  const userId = auth.session?.user.id
  const profile = useProfile(userId)
  const matches = useMatches()
  const predictions = useMyPredictions(userId)
  const scores = useMyScores(userId)
  const ranking = useRanking()
  const teams = useTeams()
  const tournamentPrediction = useTournamentPrediction(userId)
  const tournamentLock = useTournamentLockOpen()
  const groupPredictions = useMyGroupPredictions(userId)
  const groupLocks = useGroupLocks()
  const pendingCount = useOpenPendingMatchesCount()
  const stats = useUserStats(userId)
  const [active, setActive] = useState<MatchWithTeams | null>(null)
  const { t } = useTranslation('home')

  useRealtimeInvalidator({
    tables: ['matches', 'scores'],
    queryKeys: [['matches'], ['ranking'], ['my-scores', userId]],
  })

  const championTeam = useMemo(
    () =>
      teams.data?.find(
        (team) => team.id === tournamentPrediction.data?.champion_team_id,
      ) ?? null,
    [teams.data, tournamentPrediction.data],
  )
  const runnerUpTeam = useMemo(
    () =>
      teams.data?.find(
        (team) => team.id === tournamentPrediction.data?.runner_up_team_id,
      ) ?? null,
    [teams.data, tournamentPrediction.data],
  )
  const thirdTeam = useMemo(
    () =>
      teams.data?.find(
        (team) => team.id === tournamentPrediction.data?.third_place_team_id,
      ) ?? null,
    [teams.data, tournamentPrediction.data],
  )

  const groupSummary = useMemo(() => {
    const savedSet = new Set(
      groupPredictions.data?.map((p) => p.group_letter) ?? [],
    )
    const open = ALL_GROUPS.filter((l) => groupLocks.data?.[l]).length
    const saved = ALL_GROUPS.filter((l) => savedSet.has(l)).length
    return { open, saved, total: ALL_GROUPS.length }
  }, [groupPredictions.data, groupLocks.data])

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  const live = useMemo(
    () => (matches.data ?? []).filter((m) => m.status === 'live'),
    [matches.data],
  )

  const upcoming = useMemo(() => {
    return (matches.data ?? [])
      .filter((m) => m.status === 'scheduled')
      .slice(0, 5)
  }, [matches.data])

  const myRow = useMemo(
    () => ranking.data?.find((r) => r.user_id === userId),
    [ranking.data, userId],
  )
  const myPosition = useMemo(() => {
    const idx = ranking.data?.findIndex((r) => r.user_id === userId)
    return idx === undefined || idx === -1 ? null : idx + 1
  }, [ranking.data, userId])

  const championName = useTeamName(championTeam)
  const runnerUpName = useTeamName(runnerUpTeam)
  const thirdName = useTeamName(thirdTeam)

  const accuracy = stats.data?.accuracy ?? 0

  const metricsPending = ranking.isPending || stats.isPending
  const rankingError = ranking.isError
  const statsError = stats.isError

  return (
    <section className="container space-y-6 py-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {profile.data && (
            <Avatar
              seed={profile.data.avatar_seed}
              style={profile.data.avatar_style as AvatarStyle}
              size={48}
              className="size-12"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('hello')}
            </p>
            <h1 className="font-display truncate text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
              {profile.data?.display_name ?? '—'}
            </h1>
          </div>
        </div>
        <FifaLogo size={40} variant="horizontal" className="shrink-0" />
      </header>

      {pendingCount > 0 && (
        <Link
          to="/palpitar"
          className="glow-primary group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary/50 bg-primary/10 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary"
          />
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Zap className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary">
                {t('quickPredict')}
              </p>
              <p className="font-display text-lg font-black uppercase tracking-tight">
                {t('pendingCount', { count: pendingCount })}
              </p>
            </div>
          </div>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </Link>
      )}

      {metricsPending ? (
        <MetricGridSkeleton />
      ) : (
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          variant="inline"
          tone="primary"
          icon={Trophy}
          label={t('metrics.position')}
          value={
            rankingError ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <>
                {myPosition ? `${myPosition}º` : '—'}
                {myRow && (
                  <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                    {myRow.total_points} {t('pts', { ns: 'ranking' })}
                  </span>
                )}
              </>
            )
          }
          to="/ranking"
        />
        <MetricCard
          variant="inline"
          tone="primary"
          icon={Target}
          label={t('metrics.myPredictions')}
          value={
            statsError ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <>
                {stats.data?.total_predictions ?? 0}
                {stats.data && stats.data.scored_predictions > 0 ? (
                  <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                    {t('metrics.predictionsHint', { accuracy })}
                  </span>
                ) : (
                  <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                    {t('metrics.noPredictions')}
                  </span>
                )}
              </>
            )
          }
          to="/me/predictions"
        />
        <MetricCard
          variant="inline"
          tone="gold"
          icon={Crown}
          label={t('metrics.tournament')}
          value={
            championTeam && runnerUpTeam && thirdTeam ? (
              <span
                className="flex items-center gap-1.5"
                aria-label={t('podium.summary', {
                  champion: championName,
                  runnerUp: runnerUpName,
                  third: thirdName,
                })}
              >
                <span className="flex items-center gap-1" aria-hidden>
                  <TeamFlag team={championTeam} size={14} />
                  <span className="font-display text-sm font-black uppercase tracking-tight text-gold">
                    {championTeam.code}
                  </span>
                </span>
                <span className="flex items-center gap-1" aria-hidden>
                  <TeamFlag team={runnerUpTeam} size={14} />
                  <span className="font-display text-sm font-black uppercase tracking-tight text-silver">
                    {runnerUpTeam.code}
                  </span>
                </span>
                <span className="flex items-center gap-1" aria-hidden>
                  <TeamFlag team={thirdTeam} size={14} />
                  <span className="font-display text-sm font-black uppercase tracking-tight text-bronze">
                    {thirdTeam.code}
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-sm font-bold uppercase text-muted-foreground">
                {tournamentLock.data?.open
                  ? t('metrics.chooseTournament')
                  : t('metrics.tournamentClosed')}
              </span>
            )
          }
          to="/predictions/tournament"
        />
        <MetricCard
          variant="inline"
          tone="emerald"
          icon={LayoutGrid}
          label={t('metrics.groups')}
          value={
            <>
              {t('metrics.groupsCount', {
                saved: groupSummary.saved,
                total: groupSummary.total,
              })}
              <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                {groupSummary.saved > 0
                  ? t('metrics.groupsSavedHint', {
                      count: groupSummary.saved,
                    })
                  : t('metrics.groupsEmpty', { count: groupSummary.open })}
              </span>
            </>
          }
          to="/predictions/groups"
        />
      </div>
      )}

      {live.length > 0 && (
        <div className="space-y-3">
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
        </div>
      )}

      <div className="space-y-3">
        <SectionHeader
          title={t('nextMatches')}
          trailing={
            <Link
              to="/matches"
              className="-my-2.5 -mr-2 inline-flex min-h-11 items-center px-2 text-primary hover:underline active:scale-[0.98]"
            >
              {t('viewAll')}
            </Link>
          }
        />
        {matches.isPending ? (
          <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <MatchCardSkeleton />
              </li>
            ))}
          </ul>
        ) : matches.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-8 text-center">
            <CalendarX className="size-7 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">{t('matchesError')}</p>
            <button
              type="button"
              onClick={() => matches.refetch()}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-card active:scale-[0.98]"
            >
              <RefreshCw className="size-4" aria-hidden />
              {t('tryAgain')}
            </button>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-8 text-center">
            <CalendarX className="size-7 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {t('noNextMatches')}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((m) => (
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
        )}
      </div>

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={userId}
        onClose={() => setActive(null)}
      />
    </section>
  )
}

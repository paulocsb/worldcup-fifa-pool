import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Crown,
  LayoutGrid,
  Loader2,
  Radio,
  Trophy,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOpenPendingMatchesCount } from '@/routes/quick-predict'
import { Avatar } from '@/components/Avatar'
import { FifaLogo } from '@/components/FifaLogo'
import { MatchCard } from '@/components/MatchCard'
import { PredictionSheet } from '@/components/PredictionSheet'
import { SectionHeader } from '@/components/SectionHeader'
import { TeamFlag } from '@/components/TeamFlag'
import { useAuth } from '@/hooks/useAuth'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useProfile } from '@/hooks/useProfile'
import { useRanking } from '@/hooks/useRanking'
import { useTeams, useTournamentLockOpen } from '@/hooks/useTeams'
import { useTournamentPrediction } from '@/hooks/useTournamentPrediction'
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
  const ranking = useRanking()
  const teams = useTeams()
  const tournamentPrediction = useTournamentPrediction(userId)
  const tournamentLock = useTournamentLockOpen()
  const groupPredictions = useMyGroupPredictions(userId)
  const groupLocks = useGroupLocks()
  const pendingCount = useOpenPendingMatchesCount()
  const [active, setActive] = useState<MatchWithTeams | null>(null)
  const { t } = useTranslation('home')
  const { t: tRanking } = useTranslation('ranking')

  useRealtimeInvalidator({
    tables: ['matches', 'scores'],
    queryKeys: [['matches'], ['ranking']],
  })

  const championTeam = useMemo(
    () =>
      teams.data?.find(
        (team) => team.id === tournamentPrediction.data?.champion_team_id,
      ) ?? null,
    [teams.data, tournamentPrediction.data],
  )
  const championName = useTeamName(championTeam)

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
            <h1 className="font-display truncate text-3xl font-black uppercase tracking-tight">
              {profile.data?.display_name ?? '—'}
            </h1>
          </div>
        </div>
        <FifaLogo size={40} variant="horizontal" className="shrink-0" />
      </header>

      <Link
        to="/ranking"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trophy className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('yourPosition')}
            </p>
            <p className="font-display text-lg font-bold">
              {myPosition ? `${myPosition}º` : '—'}
              {myRow && (
                <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                  {myRow.total_points} {tRanking('pts')}
                </span>
              )}
            </p>
          </div>
        </div>
        <ArrowRight className="size-5 text-muted-foreground" />
      </Link>

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

      <Link
        to="/predictions/tournament"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Crown className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase text-muted-foreground">
              {t('tournamentPrediction')}
            </p>
            {championTeam ? (
              <div className="flex items-center gap-2">
                <TeamFlag team={championTeam} size={28} />
                <span className="font-display text-xl font-black uppercase leading-none tracking-tight text-gold">
                  {championTeam.code}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {championName}
                </span>
              </div>
            ) : (
              <p className="text-sm font-semibold">
                {tournamentLock.data?.open
                  ? t('betChampion')
                  : t('closed')}
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>

      <Link
        to="/predictions/groups"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <LayoutGrid className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase text-muted-foreground">
              {t('groupPredictions')}
            </p>
            <p className="text-sm font-semibold">
              {t('groupSummary', {
                saved: groupSummary.saved,
                total: groupSummary.total,
                open: groupSummary.open,
              })}
            </p>
          </div>
        </div>
        <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>

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
            <Link to="/matches" className="text-primary hover:underline">
              {t('viewAll')}
            </Link>
          }
        />
        {matches.isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('noNextMatches')}
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((m) => (
              <li key={m.id}>
                <MatchCard
                  match={m}
                  prediction={predictionByMatch.get(m.id)}
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

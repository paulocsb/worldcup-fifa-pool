import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Loader2,
  Crown,
  Award,
  Medal,
  Radio,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { SectionHeader } from '@/components/SectionHeader'
import { SubTabs } from '@/components/SubTabs'
import { MyPredictionRow } from '@/components/MyPredictionRow'
import { Surface } from '@/components/Surface'
import { TeamFlag } from '@/components/TeamFlag'
import { GroupPill } from '@/components/GroupPill'
import { PredictionScoreBadge } from '@/components/PredictionScoreBadge'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import {
  useMyGroupPredictions,
  useGroupLocks,
  ALL_GROUPS,
  type GroupLetter,
} from '@/hooks/useGroupPredictions'
import { useTournamentPrediction } from '@/hooks/useTournamentPrediction'
import { useTeams } from '@/hooks/useTeams'
import { useMyScores } from '@/hooks/useMyScores'
import { useUserStats } from '@/hooks/useUserStats'
import { useProfile } from '@/hooks/useProfile'
import { useTranslation } from 'react-i18next'
import { groupColorToken, PHASE_LABEL_PT } from '@/lib/groupColors'
import { isPredictionOpen } from '@/lib/matchLock'
import { useTeamName } from '@/lib/teamI18n'
import { AVATAR_STYLE, type AvatarStyle } from '@/lib/dicebear'
import type { MatchStage, Team } from '@/types/db'
import { cn } from '@/lib/utils'

type SourceTab = 'match' | 'group' | 'tournament'

function isSourceTab(value: string | null): value is SourceTab {
  return value === 'match' || value === 'group' || value === 'tournament'
}

// ---------------------------------------------------------------------------
// Entry points: rota do próprio user vs rota pública
// ---------------------------------------------------------------------------

/** /me/predictions — palpites do user logado, sem filtro de lock. */
export function MyPredictionsPage() {
  const auth = useAuth()
  return (
    <UserPredictionsView userId={auth.session?.user.id} isPublicView={false} />
  )
}

/**
 * /u/:userId/predictions — palpites de outro user. Mostra só palpites de
 * partidas/grupos/torneio que JÁ ESTÃO LOCKED. Se o user logado abrir esta
 * rota com seu próprio id, cai no modo self automaticamente.
 */
export function PublicPredictionsPage() {
  const { userId } = useParams<{ userId: string }>()
  const auth = useAuth()
  const isSelf = userId === auth.session?.user.id
  return <UserPredictionsView userId={userId} isPublicView={!isSelf} />
}

// ---------------------------------------------------------------------------
// View compartilhada
// ---------------------------------------------------------------------------

function UserPredictionsView({
  userId,
  isPublicView,
}: {
  userId: string | undefined
  isPublicView: boolean
}) {
  const profile = useProfile(userId)
  const stats = useUserStats(userId)
  const scores = useMyScores(userId)
  const matches = useMatches()
  const { t } = useTranslation('matches')

  const [params, setParams] = useSearchParams()
  const tab: SourceTab = isSourceTab(params.get('source'))
    ? (params.get('source') as SourceTab)
    : 'match'

  const TABS_LOCAL: ReadonlyArray<{ slug: SourceTab; label: string }> = [
    { slug: 'match', label: t('mePage.tabs.matches') },
    { slug: 'group', label: t('mePage.tabs.groups') },
    { slug: 'tournament', label: t('mePage.tabs.tournament') },
  ]

  function changeTab(slug: SourceTab) {
    const next = new URLSearchParams(params)
    next.set('source', slug)
    setParams(next, { replace: true })
  }

  // Tournament fica locked enquanto pelo menos 1 match scheduled da fase de
  // grupos existir (mesma regra do DB function tournament_predictions_open).
  const tournamentOpen = useMemo(
    () =>
      (matches.data ?? []).some(
        (m) => m.stage === 'group' && m.status === 'scheduled',
      ),
    [matches.data],
  )

  const headerTitle = isPublicView
    ? (profile.data?.display_name ?? t('mePage.title'))
    : t('mePage.title')
  const headerSubtitle = isPublicView
    ? t('mePage.publicSubtitle')
    : t('mePage.subtitle')

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        backTo={isPublicView ? '/ranking' : '/profile'}
        trailing={
          isPublicView && profile.data ? (
            <Avatar
              seed={profile.data.avatar_seed ?? ''}
              style={
                (profile.data.avatar_style as AvatarStyle | null) ??
                AVATAR_STYLE
              }
              size={44}
              className="size-11 ring-2 ring-border"
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs">
        <Summary
          label={t('mePage.summaryPoints')}
          value={stats.data?.total_points ?? scores.data?.total ?? 0}
        />
        <Separator />
        <Summary
          label={t('mePage.summaryPredictions')}
          value={stats.data?.total_predictions ?? 0}
        />
        <Separator />
        <Summary
          label={t('mePage.summaryExacts')}
          value={stats.data?.exact_scores ?? 0}
        />
      </div>

      <SubTabs tabs={TABS_LOCAL} active={tab} onChange={changeTab} />

      {tab === 'match' && (
        <MatchPalpites userId={userId} isPublicView={isPublicView} />
      )}
      {tab === 'group' && (
        <GroupPalpites userId={userId} isPublicView={isPublicView} />
      )}
      {tab === 'tournament' && (
        <TournamentPalpite
          userId={userId}
          isPublicView={isPublicView}
          tournamentOpen={tournamentOpen}
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-display text-base font-bold tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function Separator() {
  return <span className="text-muted-foreground/30">·</span>
}

function MatchPalpites({
  userId,
  isPublicView,
}: {
  userId: string | undefined
  isPublicView: boolean
}) {
  const { t } = useTranslation('matches')
  const matches = useMatches()
  const predictions = useMyPredictions(userId)
  const scores = useMyScores(userId)

  const isPending =
    matches.isPending || predictions.isPending || scores.isPending

  const {
    live,
    finishedGroups,
    scheduledGroups,
    finishedCount,
    scheduledCount,
    totalCount,
  } = useMemo(() => {
    const byMatch = new Map(
      (matches.data ?? []).map((m) => [m.id, m] as const),
    )
    type Row = {
      match: NonNullable<ReturnType<typeof byMatch.get>>
      prediction: typeof predictions.data extends Array<infer T> ? T : never
    }
    const rows = (predictions.data ?? [])
      .map((p) => {
        const m = byMatch.get(p.match_id)
        return m ? { match: m, prediction: p } : null
      })
      .filter((x): x is Row => Boolean(x))
      // Visão pública: filtra palpites ainda em aberto (lock não passou).
      .filter((r) => (isPublicView ? !isPredictionOpen(r.match) : true))

    function ts(r: Row) {
      return new Date(r.match.kickoff_at).getTime()
    }

    // Live: ordenado por kickoff asc (não faz muita diferença)
    const live = rows
      .filter((r) => r.match.status === 'live')
      .sort((a, b) => ts(a) - ts(b))

    // Finalizados: mais recente primeiro
    const finished = rows
      .filter((r) => r.match.status === 'finished')
      .sort((a, b) => ts(b) - ts(a))

    // Aguardando: próximo primeiro
    const scheduled = rows
      .filter((r) => r.match.status === 'scheduled')
      .sort((a, b) => ts(a) - ts(b))

    function groupByPhase(list: Row[]) {
      const groups = new Map<
        string,
        { key: string; title: string; rows: Row[] }
      >()
      for (const r of list) {
        const md = r.match.matchday
        const stageLabel = PHASE_LABEL_PT[r.match.stage as MatchStage]
        const key =
          r.match.stage === 'group' && md != null
            ? `${r.match.stage}-md${md}`
            : r.match.stage
        const title =
          r.match.stage === 'group' && md != null
            ? `${stageLabel} · MD${md}`
            : stageLabel
        const bucket = groups.get(key) ?? { key, title, rows: [] }
        bucket.rows.push(r)
        groups.set(key, bucket)
      }
      return Array.from(groups.values())
    }

    return {
      live,
      finishedGroups: groupByPhase(finished),
      scheduledGroups: groupByPhase(scheduled),
      finishedCount: finished.length,
      scheduledCount: scheduled.length,
      totalCount: live.length + finished.length + scheduled.length,
    }
  }, [matches.data, predictions.data, isPublicView])

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (totalCount === 0) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        as="p"
        className="p-8 text-center text-sm text-muted-foreground"
      >
        {isPublicView
          ? t('mePage.noMatchPalpitesPublic')
          : t('mePage.noMatchPalpites')}
      </Surface>
    )
  }

  return (
    <div className="space-y-6">
      {live.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            title={t('liveNow')}
            tone="destructive"
            icon={<Radio className="size-4" />}
            trailing={t('matchesCount', { count: live.length })}
          />
          <ul className="space-y-2">
            {live.map((r) => (
              <li key={r.match.id}>
                <MyPredictionRow
                  match={r.match}
                  prediction={r.prediction}
                  score={scores.data?.byMatch.get(r.match.id) ?? null}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {finishedGroups.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title={t('mePage.finished')}
            tone="primary"
            icon={<CheckCircle2 className="size-4" />}
            trailing={t('matchesCount', { count: finishedCount })}
          />
          <div className="space-y-4">
            {finishedGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <SectionHeader title={g.title} tone="muted" size="sm" />
                <ul className="space-y-2">
                  {g.rows.map((r) => (
                    <li key={r.match.id}>
                      <MyPredictionRow
                        match={r.match}
                        prediction={r.prediction}
                        score={scores.data?.byMatch.get(r.match.id) ?? null}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {scheduledGroups.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title={t('mePage.waitingSection')}
            tone="muted"
            icon={<Clock className="size-4" />}
            trailing={t('matchesCount', { count: scheduledCount })}
          />
          <div className="space-y-4">
            {scheduledGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <SectionHeader title={g.title} tone="muted" size="sm" />
                <ul className="space-y-2">
                  {g.rows.map((r) => (
                    <li key={r.match.id}>
                      <MyPredictionRow
                        match={r.match}
                        prediction={r.prediction}
                        score={scores.data?.byMatch.get(r.match.id) ?? null}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function GroupPalpites({
  userId,
  isPublicView,
}: {
  userId: string | undefined
  isPublicView: boolean
}) {
  const groupPreds = useMyGroupPredictions(userId)
  const teams = useTeams()
  const scores = useMyScores(userId)
  const locks = useGroupLocks()
  const { t } = useTranslation('matches')

  if (groupPreds.isPending || teams.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const teamById = new Map((teams.data ?? []).map((t) => [t.id, t] as const))
  const predByLetter = new Map(
    (groupPreds.data ?? []).map((p) => [p.group_letter, p] as const),
  )

  const visibleLetters = ALL_GROUPS.filter((letter) => {
    if (!predByLetter.has(letter)) return false
    if (!isPublicView) return true
    // Visão pública: mostra só grupos com lock fechado
    const isOpen = locks.data?.[letter] ?? false
    return !isOpen
  })

  if (visibleLetters.length === 0) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        as="p"
        className="p-8 text-center text-sm text-muted-foreground"
      >
        {isPublicView
          ? t('mePage.noGroupPalpitesPublic')
          : t('mePage.noGroupPalpites')}
      </Surface>
    )
  }

  return (
    <ul className="space-y-2">
      {visibleLetters.map((letter: GroupLetter) => {
        const pred = predByLetter.get(letter)!
        const score = scores.data?.byGroup.get(letter) ?? null
        const token = groupColorToken(letter)
        const order = [
          pred.first_team_id,
          pred.second_team_id,
          pred.third_team_id,
          pred.fourth_team_id,
        ]
          .map((id) => (id != null ? teamById.get(id) : null) ?? null)
          .filter((t): t is Team => Boolean(t))

        return (
          <li key={letter}>
            <Surface
              variant="tonal"
              accent={token ?? undefined}
              padding="none"
              className="overflow-hidden"
            >
              {/* Header NEUTRO (bg-muted/40): pontos à ESQUERDA, pílula de
                  identidade solid à DIREITA. A cor do grupo já vem da BORDA
                  accent do Surface + da pílula — band neutra evita conflito com
                  os pontos coloridos. */}
              <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                <PredictionScoreBadge points={score?.points ?? null} />
                <GroupPill letter={letter} variant="solid" size="sm" />
              </div>
              <ol className="space-y-1 px-3 pb-3 pt-2">
                {order.map((team, idx) => (
                  <OrderedTeamRow
                    key={team.id}
                    team={team}
                    position={idx + 1}
                  />
                ))}
              </ol>
            </Surface>
          </li>
        )
      })}
    </ul>
  )
}

function TournamentPalpite({
  userId,
  isPublicView,
  tournamentOpen,
}: {
  userId: string | undefined
  isPublicView: boolean
  tournamentOpen: boolean
}) {
  const pred = useTournamentPrediction(userId)
  const teams = useTeams()
  const scores = useMyScores(userId)
  const { t } = useTranslation('matches')

  if (pred.isPending || teams.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Visão pública e palpite ainda em aberto → esconde
  if (isPublicView && tournamentOpen) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        as="p"
        className="p-8 text-center text-sm text-muted-foreground"
      >
        {t('mePage.tournamentLockedSubtitle')}
      </Surface>
    )
  }

  if (!pred.data) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        as="p"
        className="p-8 text-center text-sm text-muted-foreground"
      >
        {isPublicView
          ? t('mePage.noTournamentPalpitePublic')
          : t('mePage.noTournamentPalpite')}
      </Surface>
    )
  }

  const teamById = new Map((teams.data ?? []).map((t) => [t.id, t] as const))
  const score = scores.data?.tournament ?? null
  const breakdown = (score?.breakdown ?? {}) as Record<string, number>

  const picks = [
    {
      title: t('mePage.champion'),
      teamId: pred.data.champion_team_id,
      icon: <Crown className="size-4 text-gold" />,
      accent: 'accent-gold',
      points: breakdown.champion ?? null,
    },
    {
      title: t('mePage.runnerUp'),
      teamId: pred.data.runner_up_team_id,
      icon: <Award className="size-4 text-muted-foreground" />,
      accent: 'accent-silver',
      points: breakdown.runner_up ?? null,
    },
    {
      title: t('mePage.thirdPlace'),
      teamId: pred.data.third_place_team_id,
      icon: <Medal className="size-4 text-amber-700" />,
      accent: 'accent-bronze',
      points: breakdown.third_place ?? null,
    },
  ]

  return (
    <ul className="space-y-2">
      {picks.map((p) => (
        <TournamentPickRow
          key={p.title}
          title={p.title}
          icon={p.icon}
          team={teamById.get(p.teamId) ?? null}
          accent={p.accent}
          points={p.points}
        />
      ))}

      {score && (
        <li>
          <Surface
            variant="tonal"
            accent="primary"
            padding="none"
            className="flex items-center justify-between bg-primary/5 px-3 py-2 text-sm"
          >
            <span className="font-semibold">{t('mePage.tournamentTotal')}</span>
            <PredictionScoreBadge points={score.points} className="text-base" />
          </Surface>
        </li>
      )}
    </ul>
  )
}

function TournamentPickRow({
  title,
  icon,
  team,
  accent,
  points,
}: {
  title: string
  icon: React.ReactNode
  team: Team | null
  /** Token cerimonial: 'accent-gold' (campeão) | 'accent-silver' | 'accent-bronze'. */
  accent: string
  points: number | null
}) {
  const name = useTeamName(team)
  const isChampion = accent === 'accent-gold'
  return (
    <li>
      <Surface
        variant="tonal"
        accent={accent}
        padding="none"
        className={cn(
          'flex items-center gap-3 p-3',
          // Campeão ganha realce de fundo gold (a borda já vem do accent).
          isChampion && 'bg-gold/[0.06]',
        )}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <TeamFlag team={team} size={22} />
            <span className="font-display text-base font-bold uppercase tracking-tight">
              {team?.code ?? '—'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {name}
            </span>
          </div>
        </div>
        <PredictionScoreBadge points={points} />
      </Surface>
    </li>
  )
}

function OrderedTeamRow({
  team,
  position,
}: {
  team: Team
  position: number
}) {
  const name = useTeamName(team)
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="font-display w-4 text-center text-xs font-bold tabular-nums text-muted-foreground">
        {position}
      </span>
      <TeamFlag team={team} size={20} />
      <span className="font-semibold">{team.code}</span>
      <span className="ml-1 truncate text-xs text-muted-foreground">
        {name}
      </span>
    </li>
  )
}

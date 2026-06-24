import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  Pencil,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TeamFlag } from '@/components/TeamFlag'
import { GroupPill } from '@/components/GroupPill'
import { useTeamName } from '@/lib/teamI18n'
import { PageHeader } from '@/components/PageHeader'
import { Surface } from '@/components/Surface'
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
          {ALL_GROUPS.map((letter: GroupLetter, idx: number) => {
            const isOpen = locks.data?.[letter] ?? false
            const myPred = predictionByGroup.get(letter)
            const grpTeams = teamsByGroup.get(letter) ?? []
            const status = !isOpen
              ? 'locked'
              : myPred
                ? 'saved'
                : 'pending'

            const token = groupColorToken(letter)

            return (
              <li
                key={letter}
                className="animate-float-in"
                // Stagger escalonado por índice, com teto pra os 12 grupos não
                // demorarem a entrar (mesmo padrão do Ranking, agora com delay).
                style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
              >
                <Link
                  to={`/predictions/groups/${letter}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Surface
                    as="article"
                    variant="tonal"
                    interactive
                    accent={token ?? undefined}
                    padding="none"
                    className="overflow-hidden"
                  >
                    <header className="flex items-center justify-between gap-2 bg-[hsl(var(--accent-c)_/_0.12)] px-4 py-2.5">
                      <GroupPill letter={letter} size="md" withLabel />
                      <StatusBadge status={status} />
                    </header>
                    <div className="p-4 pt-3">
                      <GroupOrder
                        ordered={orderTeams(grpTeams, myPred)}
                        predicted={Boolean(myPred)}
                      />
                    </div>
                    <ActionBar isOpen={isOpen} hasPrediction={Boolean(myPred)} />
                  </Surface>
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
 * Returns the 4 teams in the order to display. With a prediction, follows the
 * user's 1º→4º ordering; without one, keeps the screen's pot order (id ASC,
 * already applied upstream).
 */
function orderTeams(teams: Team[], pred?: GroupPrediction): Team[] {
  if (!pred) return teams
  const byId = new Map(teams.map((t) => [t.id, t]))
  const ids = [
    pred.first_team_id,
    pred.second_team_id,
    pred.third_team_id,
    pred.fourth_team_id,
  ]
  return ids.map((id) => byId.get(id)).filter((t): t is Team => Boolean(t))
}

/**
 * Single source of truth for the 4-team list, structurally identical with or
 * without a prediction. Only the ordering (handled upstream) and the position
 * tile treatment differ between states (see PositionTile).
 */
function GroupOrder({
  ordered,
  predicted,
}: {
  ordered: Team[]
  predicted: boolean
}) {
  return (
    <ol className="space-y-1.5">
      {ordered.map((team, i) => {
        const position = i + 1
        return (
          <li key={team.id} className="space-y-1.5">
            {/* Linha de corte tracejada entre 2º e 3º — só quando há palpite,
                comunicando classificação direta → repescagem (estilo Standings). */}
            {predicted && position === 3 && (
              <div
                aria-hidden
                className="border-t border-dashed border-border/70"
              />
            )}
            <GroupTeamRow
              team={team}
              position={position}
              predicted={predicted}
            />
          </li>
        )
      })}
    </ol>
  )
}

/** Unified team row: numbered tile + flag + name + code. */
function GroupTeamRow({
  team,
  position,
  predicted,
}: {
  team: Team
  position: number
  predicted: boolean
}) {
  const name = useTeamName(team)
  return (
    <div className="flex items-center gap-2.5">
      <PositionTile position={position} predicted={predicted} />
      <TeamFlag team={team} size={26} />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold">{name}</div>
        {team.code && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {team.code}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Square numbered tile, Ranking-style. When `predicted`, the fill + number
 * color encode the qualification zone (same semantics as Standings):
 *   1º/2º → primary (classifica direto), 3º → amber (repescagem), 4º → neutral.
 * Without a prediction the tile is neutral with a discreet dash, so an empty
 * state never looks like a guess.
 */
function PositionTile({
  position,
  predicted,
}: {
  position: number
  predicted: boolean
}) {
  if (!predicted) {
    return (
      <div
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/60"
      >
        <span className="text-xs leading-none">–</span>
      </div>
    )
  }
  const tone =
    position <= 2
      ? 'bg-primary/15 text-primary'
      : position === 3
        ? 'bg-amber-500/15 text-amber-500'
        : 'bg-muted text-muted-foreground'
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-lg',
        tone,
      )}
    >
      <span className="font-display text-xs font-black leading-none tabular-nums">
        {position}
      </span>
    </div>
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

/**
 * Bottom action band of the group card. Not an interactive element itself —
 * the whole card is a <Link>; this is the visually "clickable" zone that signals
 * where the tap leads. Four states, mirroring the StatusBadge semantics:
 *   open + empty  → primary CTA "Fazer palpite" (the only scorable action left)
 *   open + saved  → neutral "Editar palpite"
 *   locked + saved → muted, locked "Seu palpite (encerrado)"
 *   locked + empty → muted, locked "Encerrado sem palpite"
 */
function ActionBar({
  isOpen,
  hasPrediction,
}: {
  isOpen: boolean
  hasPrediction: boolean
}) {
  const { t } = useTranslation('predictions')

  if (isOpen && !hasPrediction) {
    return (
      <div className="flex min-h-11 items-center gap-2 border-t border-border/60 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
        <Pencil className="size-4 shrink-0" />
        <span className="flex-1">{t('groups.footerOpenCta')}</span>
        <ArrowRight className="size-4 shrink-0" />
      </div>
    )
  }

  if (isOpen && hasPrediction) {
    return (
      <div className="flex min-h-11 items-center gap-2 border-t border-border/60 px-4 py-2.5 text-sm font-medium text-foreground/80">
        <Pencil className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{t('groups.footerEdit')}</span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-11 items-center gap-2 border-t border-border/60 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground">
      <Lock className="size-4 shrink-0" />
      <span className="flex-1">
        {hasPrediction
          ? t('groups.footerSavedLocked')
          : t('groups.footerLockedEmpty')}
      </span>
      <ArrowRight className="size-4 shrink-0" />
    </div>
  )
}

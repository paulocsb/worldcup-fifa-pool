import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TableProperties } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BracketPhase } from '@/components/BracketPhase'
import { GroupPill } from '@/components/GroupPill'
import { GroupStandingsSkeleton } from '@/components/GroupTableSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { SubTabs } from '@/components/SubTabs'
import { TeamFlag } from '@/components/TeamFlag'
import { useGroupStandings } from '@/hooks/useGroupStandings'
import { useMatches } from '@/hooks/useMatches'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { usePageBackground } from '@/hooks/usePageBackground'
import {
  ALL_GROUPS,
  type GroupLetter,
} from '@/hooks/useGroupPredictions'
import { groupColorToken } from '@/lib/groupColors'
import {
  currentPhase,
  getTabs,
  stagesForTab,
  subtitleForTab,
  tabBySlug,
  type TabSlug,
} from '@/lib/tournamentPhase'
import type { GroupStanding } from '@/types/db'
import { cn } from '@/lib/utils'

/**
 * Tela de classificação do torneio com tabs por fase.
 *
 * - Fase de Grupos: 12 tabelas (top 2 verde, 3º amber)
 * - 32-avos → Final: lista de cards via BracketPhase
 *
 * A tab inicial é determinada pelo estado do torneio (currentPhase) ou pode
 * vir explicitamente via ?phase=r32 na URL (deep link).
 */
export function StandingsPage() {
  const [params, setParams] = useSearchParams()
  const matches = useMatches()
  const { t } = useTranslation('standings')

  const initialPhase = useMemo(
    () => currentPhase(matches.data ?? []),
    [matches.data],
  )
  const urlPhase = tabBySlug(params.get('phase') ?? '')
  const activeTab: TabSlug = urlPhase ?? initialPhase

  // Background contextual segue a fase ativa
  usePageBackground(
    activeTab === 'group'
      ? 'group-stage'
      : activeTab === 'final'
        ? 'final'
        : 'knockouts',
  )

  function handleChangeTab(slug: TabSlug) {
    const next = new URLSearchParams(params)
    next.set('phase', slug)
    setParams(next, { replace: true })
  }

  const tabs = getTabs()
  const activeTabStages = stagesForTab(activeTab)

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={t('pageTitle')}
        subtitle={subtitleForTab(activeTab)}
        backTo="/"
      />

      <SubTabs tabs={tabs} active={activeTab} onChange={handleChangeTab} />

      {activeTab === 'group' ? (
        <GroupStandingsContent />
      ) : (
        <BracketPhase stages={activeTabStages} slug={activeTab} />
      )}
    </section>
  )
}

function GroupStandingsContent() {
  const standings = useGroupStandings()
  const { t: tStandings } = useTranslation('standings')
  useRealtimeInvalidator({
    tables: ['matches'],
    queryKeys: [['group-standings']],
  })

  const byGroup = useMemo(() => {
    const map = new Map<string, GroupStanding[]>()
    for (const row of standings.data ?? []) {
      const list = map.get(row.group_letter ?? '') ?? []
      list.push(row)
      map.set(row.group_letter ?? '', list)
    }
    return map
  }, [standings.data])

  if (standings.isPending) {
    return <GroupStandingsSkeleton />
  }

  if (standings.isError) {
    return (
      <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {tStandings('loadError', { message: (standings.error as Error).message })}
      </p>
    )
  }

  // A view group_standings faz LEFT JOIN a partir de teams, então normalmente
  // retorna as 48 linhas (12 grupos × 4) mesmo pré-torneio (zeradas). Vir vazia
  // só ocorre se não há seleções cadastradas — empty state defensivo.
  if (byGroup.size === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-8 text-center">
        <TableProperties className="size-7 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">{tStandings('empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_GROUPS.map((letter: GroupLetter) => (
          <GroupTable
            key={letter}
            letter={letter}
            rows={byGroup.get(letter) ?? []}
          />
        ))}
      </div>
      <QualificationLegend />
    </div>
  )
}

function QualificationLegend() {
  const { t } = useTranslation('standings')
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-[11px] text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-[3px] bg-primary"
        />
        {t('legend.qualified')}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-[3px] bg-amber-500"
        />
        {t('legend.playoff')}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-[3px] border border-border bg-muted"
        />
        {t('legend.eliminated')}
      </li>
    </ul>
  )
}

function GroupTable({
  letter,
  rows,
}: {
  letter: GroupLetter
  rows: GroupStanding[]
}) {
  const { t } = useTranslation('standings')
  const token = groupColorToken(letter)
  const accentStyle = token
    ? ({ '--accent-c': `hsl(var(--${token}))` } as React.CSSProperties)
    : undefined

  return (
    <article
      style={accentStyle}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1 [background-color:var(--accent-c)]"
      />
      <header className="px-3 pt-2.5">
        <GroupPill letter={letter} size="md" withLabel />
      </header>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          {t('groupCaption', { letter })}
        </caption>
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-6" />
          <col className="w-6" />
          <col className="w-6" />
          <col className="w-6" />
          <col className="hidden w-7 sm:table-column" />
          <col className="hidden w-7 sm:table-column" />
          <col className="w-8" />
          <col className="w-9" />
        </colgroup>
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="py-1.5 pl-3 text-center">
              <span className="sr-only">{t('tableHeaders.position')}</span>
            </th>
            <th scope="col" className="py-1.5 text-left">
              <span className="sr-only">{t('tableHeaders.team')}</span>
            </th>
            <th scope="col" className="py-1.5 text-center" title={t('tableHeaders.playedLong')}>
              {t('tableHeaders.played')}
            </th>
            <th scope="col" className="py-1.5 text-center" title={t('tableHeaders.winsLong')}>
              {t('tableHeaders.wins')}
            </th>
            <th scope="col" className="py-1.5 text-center" title={t('tableHeaders.drawsLong')}>
              {t('tableHeaders.draws')}
            </th>
            <th scope="col" className="py-1.5 text-center" title={t('tableHeaders.lossesLong')}>
              {t('tableHeaders.losses')}
            </th>
            <th
              scope="col"
              className="hidden py-1.5 text-center sm:table-cell"
              title={t('tableHeaders.goalsForLong')}
            >
              {t('tableHeaders.goalsFor')}
            </th>
            <th
              scope="col"
              className="hidden py-1.5 text-center sm:table-cell"
              title={t('tableHeaders.goalsAgainstLong')}
            >
              {t('tableHeaders.goalsAgainst')}
            </th>
            <th scope="col" className="py-1.5 text-center" title={t('tableHeaders.goalDiffLong')}>
              {t('tableHeaders.goalDiff')}
            </th>
            <th scope="col" className="py-1.5 pr-3 text-center" title={t('tableHeaders.pointsLong')}>
              {t('tableHeaders.points')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="px-3 py-6 text-center text-xs text-muted-foreground"
              >
                {t('emptyGroup')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <StandingRow key={row.team_id ?? row.team_code} row={row} />
            ))
          )}
        </tbody>
      </table>
    </article>
  )
}

function StandingRow({ row }: { row: GroupStanding }) {
  const { t } = useTranslation('standings')

  // Hierarquia cromática: a borda-left fica reservada à IDENTIDADE DO GRUPO
  // (faixa lateral do card). O status de QUALIFICAÇÃO é comunicado apenas pelo
  // preenchimento da linha + a linha de corte tracejada + a legenda.
  // Top 2: classificados garantidos (verde)
  // 3º: vaga por repescagem — depende dos outros grupos (amber)
  // 4º: eliminado (neutro)
  const tone =
    row.position === 1 || row.position === 2
      ? 'bg-primary/15'
      : row.position === 3
        ? 'bg-amber-500/15'
        : ''

  // Divisória entre linhas; o 3º recebe a "linha de corte" tracejada e mais
  // forte, separando "acima = classificado" da repescagem pra baixo.
  const divider =
    row.position === 3
      ? 'border-t-2 border-dashed border-border'
      : (row.position ?? 1) > 1
        ? 'border-t border-border/40'
        : ''

  const played = row.played ?? 0
  const won = row.won ?? 0
  const drawn = row.drawn ?? 0
  const lost = row.lost ?? 0
  const goalsFor = row.goals_for ?? 0
  const goalsAgainst = row.goals_against ?? 0
  const diff = row.goal_diff ?? 0
  const points = row.points ?? 0

  return (
    <tr className={cn('text-sm', tone, divider)}>
      <th
        scope="row"
        className="font-display py-2 pl-3 text-center align-middle text-xs font-bold tabular-nums text-muted-foreground"
      >
        <span aria-label={t('cell.position', { position: row.position ?? 0 })}>
          {row.position ?? '—'}
        </span>
      </th>
      <td className="py-2 pl-1.5 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            team={
              row.flag_url
                ? ({
                    id: row.team_id ?? 0,
                    name: row.team_name ?? '',
                    code: row.team_code ?? '',
                    flag_url: row.flag_url,
                    group_letter: row.group_letter ?? '',
                    fifa_ranking: null,
                    api_team_id: null,
                    created_at: '',
                  } as never)
                : null
            }
            size={22}
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold">
            <span className="sm:hidden">{row.team_code ?? row.team_name}</span>
            <span className="hidden sm:inline">
              {row.team_name ?? row.team_code}
            </span>
          </span>
        </div>
      </td>
      <td
        className="py-2 text-center align-middle text-xs tabular-nums text-muted-foreground"
        aria-label={t('cell.played', { count: played })}
      >
        {played}
      </td>
      <td
        className="py-2 text-center align-middle text-xs tabular-nums text-muted-foreground"
        aria-label={t('cell.wins', { count: won })}
      >
        {won}
      </td>
      <td
        className="py-2 text-center align-middle text-xs tabular-nums text-muted-foreground"
        aria-label={t('cell.draws', { count: drawn })}
      >
        {drawn}
      </td>
      <td
        className="py-2 text-center align-middle text-xs tabular-nums text-muted-foreground"
        aria-label={t('cell.losses', { count: lost })}
      >
        {lost}
      </td>
      <td
        className="hidden py-2 text-center align-middle text-xs tabular-nums text-muted-foreground sm:table-cell"
        aria-label={t('cell.goalsFor', { count: goalsFor })}
      >
        {goalsFor}
      </td>
      <td
        className="hidden py-2 text-center align-middle text-xs tabular-nums text-muted-foreground sm:table-cell"
        aria-label={t('cell.goalsAgainst', { count: goalsAgainst })}
      >
        {goalsAgainst}
      </td>
      <td
        className={cn(
          'py-2 text-center align-middle text-xs tabular-nums',
          diff > 0 && 'text-primary',
          diff < 0 && 'text-muted-foreground',
        )}
        aria-label={t('cell.goalDiff', {
          value: diff > 0 ? `+${diff}` : diff,
        })}
      >
        {diff > 0 ? '+' : ''}
        {diff}
      </td>
      <td
        className="font-display py-2 pr-3 text-center align-middle text-sm font-bold tabular-nums"
        aria-label={t('cell.points', { count: points })}
      >
        {points}
      </td>
    </tr>
  )
}

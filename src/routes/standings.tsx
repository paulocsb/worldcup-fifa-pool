import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { BracketPhase } from '@/components/BracketPhase'
import { GroupPill } from '@/components/GroupPill'
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
  subtitleForTab,
  TABS,
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

  const activeTabDef = TABS.find((t) => t.slug === activeTab)!

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title="Classificação"
        subtitle={subtitleForTab(activeTab)}
        backTo="/"
      />

      <SubTabs tabs={TABS} active={activeTab} onChange={handleChangeTab} />

      {activeTab === 'group' ? (
        <GroupStandingsContent />
      ) : (
        <BracketPhase stages={activeTabDef.stages} slug={activeTab} />
      )}
    </section>
  )
}

function GroupStandingsContent() {
  const standings = useGroupStandings()
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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (standings.isError) {
    return (
      <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        Erro: {(standings.error as Error).message}
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ALL_GROUPS.map((letter: GroupLetter) => (
        <GroupTable
          key={letter}
          letter={letter}
          rows={byGroup.get(letter) ?? []}
        />
      ))}
    </div>
  )
}

function GroupTable({
  letter,
  rows,
}: {
  letter: GroupLetter
  rows: GroupStanding[]
}) {
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
        className="pointer-events-none absolute inset-y-0 left-0 w-1 [background-color:var(--accent-c)]"
      />
      <header className="flex items-center justify-between px-3 py-2.5">
        <GroupPill letter={letter} size="md" withLabel />
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-5 text-center">V</span>
          <span className="w-5 text-center">E</span>
          <span className="w-5 text-center">D</span>
          <span className="w-7 text-center">SG</span>
          <span className="w-7 text-center">PTS</span>
        </div>
      </header>
      <ol className="divide-y divide-border/40">
        {rows.map((row) => (
          <StandingRow key={row.team_id ?? row.team_code} row={row} />
        ))}
      </ol>
    </article>
  )
}

function StandingRow({ row }: { row: GroupStanding }) {
  // Top 2: classificados (verde sutil)
  // 3º: "talvez classifica" (amber sutil)
  // 4º: eliminado (sem cor)
  const tone =
    row.position === 1 || row.position === 2
      ? 'border-l-2 border-l-primary/70 bg-primary/[0.04]'
      : row.position === 3
        ? 'border-l-2 border-l-amber-500/60 bg-amber-500/[0.04]'
        : ''

  return (
    <li
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm',
        tone,
      )}
    >
      <span className="font-display w-4 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">
        {row.position ?? '—'}
      </span>
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
        {row.team_code ?? row.team_name}
      </span>
      <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
        {row.won ?? 0}
      </span>
      <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
        {row.drawn ?? 0}
      </span>
      <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
        {row.lost ?? 0}
      </span>
      <span
        className={cn(
          'w-7 text-center text-xs tabular-nums',
          (row.goal_diff ?? 0) > 0 && 'text-primary',
          (row.goal_diff ?? 0) < 0 && 'text-muted-foreground',
        )}
      >
        {(row.goal_diff ?? 0) > 0 ? '+' : ''}
        {row.goal_diff ?? 0}
      </span>
      <span className="font-display w-7 text-center text-sm font-bold tabular-nums">
        {row.points ?? 0}
      </span>
    </li>
  )
}

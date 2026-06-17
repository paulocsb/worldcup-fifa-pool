import type { ApiTeamStatistics } from '@/lib/apiFootballTypes'
import { cn } from '@/lib/utils'

const STAT_LABELS: Record<string, string> = {
  'Shots on Goal': 'Chutes no gol',
  'Shots off Goal': 'Chutes fora',
  'Total Shots': 'Chutes totais',
  'Blocked Shots': 'Chutes bloqueados',
  'Shots insidebox': 'Chutes na área',
  'Shots outsidebox': 'Chutes fora da área',
  Fouls: 'Faltas',
  'Corner Kicks': 'Escanteios',
  Offsides: 'Impedimentos',
  'Ball Possession': 'Posse de bola',
  'Yellow Cards': 'Amarelos',
  'Red Cards': 'Vermelhos',
  'Goalkeeper Saves': 'Defesas do goleiro',
  'Total passes': 'Passes totais',
  'Passes accurate': 'Passes certos',
  'Passes %': '% passes certos',
  expected_goals: 'xG',
  goals_prevented: 'Gols evitados',
}

function parseNumeric(v: string | number | null): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  const trimmed = v.toString().trim()
  if (trimmed.endsWith('%')) return Number(trimmed.slice(0, -1))
  const n = Number(trimmed)
  return Number.isNaN(n) ? null : n
}

function fmt(v: string | number | null) {
  if (v == null) return '—'
  return String(v)
}

function StatRow({
  label,
  homeVal,
  awayVal,
}: {
  label: string
  homeVal: string | number | null
  awayVal: string | number | null
}) {
  const h = parseNumeric(homeVal)
  const a = parseNumeric(awayVal)
  const total = (h ?? 0) + (a ?? 0)
  const homePct = total > 0 ? ((h ?? 0) / total) * 100 : 50
  const awayPct = total > 0 ? ((a ?? 0) / total) * 100 : 50
  const homeWins = (h ?? 0) > (a ?? 0)
  const awayWins = (a ?? 0) > (h ?? 0)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            'font-bold tabular-nums',
            homeWins && 'text-primary',
            !homeWins && awayWins && 'text-muted-foreground',
          )}
        >
          {fmt(homeVal)}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'font-bold tabular-nums',
            awayWins && 'text-primary',
            !awayWins && homeWins && 'text-muted-foreground',
          )}
        >
          {fmt(awayVal)}
        </span>
      </div>
      <div className="flex h-2 gap-1">
        <div
          className="flex h-full flex-1 justify-end overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              homeWins ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            style={{ width: `${homePct}%` }}
          />
        </div>
        <div
          className="flex h-full flex-1 justify-start overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              awayWins ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            style={{ width: `${awayPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function MatchStatistics({
  statistics,
}: {
  statistics: ApiTeamStatistics[]
}) {
  if (statistics.length !== 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Estatísticas indisponíveis para esta partida.
      </p>
    )
  }
  const [home, away] = statistics
  const types = Array.from(
    new Set([
      ...home.statistics.map((s) => s.type),
      ...away.statistics.map((s) => s.type),
    ]),
  )

  return (
    <ul className="space-y-4">
      {types.map((type) => {
        const h = home.statistics.find((s) => s.type === type)
        const a = away.statistics.find((s) => s.type === type)
        const label = STAT_LABELS[type] ?? type
        return (
          <li key={type}>
            <StatRow
              label={label}
              homeVal={h?.value ?? null}
              awayVal={a?.value ?? null}
            />
          </li>
        )
      })}
    </ul>
  )
}

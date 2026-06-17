import type { ApiLineup } from '@/lib/apiFootballTypes'

function PlayerLine({
  number,
  name,
  pos,
}: {
  number?: number
  name: string
  pos?: string | null
}) {
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold tabular-nums">
        {number ?? '—'}
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {pos && (
        <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
          {pos}
        </span>
      )}
    </li>
  )
}

function TeamLineup({ lineup }: { lineup: ApiLineup }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold">{lineup.team.name}</h3>
        <p className="text-xs text-muted-foreground">
          {lineup.formation ? `Esquema ${lineup.formation}` : '—'}
          {lineup.coach?.name ? ` · Téc. ${lineup.coach.name}` : ''}
        </p>
      </div>

      <div>
        <h4 className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
          Titulares
        </h4>
        <ul>
          {lineup.startXI.map((p, i) => (
            <PlayerLine
              key={p.player.id ?? `s${i}`}
              number={p.player.number}
              name={p.player.name}
              pos={p.player.pos}
            />
          ))}
        </ul>
      </div>

      {lineup.substitutes.length > 0 && (
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
            Reservas
          </h4>
          <ul>
            {lineup.substitutes.map((p, i) => (
              <PlayerLine
                key={p.player.id ?? `r${i}`}
                number={p.player.number}
                name={p.player.name}
                pos={p.player.pos}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function MatchLineups({ lineups }: { lineups: ApiLineup[] }) {
  if (lineups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Escalações ainda não divulgadas. Costumam sair ~1h antes do jogo.
      </p>
    )
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {lineups.map((l, i) => (
        <TeamLineup key={l.team.id ?? i} lineup={l} />
      ))}
    </div>
  )
}

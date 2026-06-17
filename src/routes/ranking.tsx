import { Loader2 } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { PositionBadge } from '@/components/PositionBadge'
import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { usePageBackground } from '@/hooks/usePageBackground'
import { AVATAR_STYLE, type AvatarStyle } from '@/lib/dicebear'
import {
  positionColorToken,
  positionFromRank,
  type CeremonialPosition,
} from '@/lib/groupColors'
import { cn } from '@/lib/utils'

function PositionMarker({ position }: { position: number }) {
  const ceremonial = positionFromRank(position)
  if (ceremonial) {
    return <PositionBadge position={ceremonial} size="md" variant="icon-only" />
  }
  return (
    <span className="font-display grid size-5 place-items-center text-xs font-bold text-muted-foreground">
      {position}
    </span>
  )
}

export function RankingPage() {
  const auth = useAuth()
  const ranking = useRanking()
  const myId = auth.session?.user.id

  useRealtimeInvalidator({
    tables: ['scores'],
    queryKeys: [['ranking']],
  })
  usePageBackground('ranking')

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title="Ranking"
        subtitle="Pontuação atualizada quando partidas encerram"
        accent="gold"
      />

      {ranking.isPending ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : ranking.isError ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Erro: {(ranking.error as Error).message}
        </p>
      ) : ranking.data?.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Ninguém no bolão ainda.
        </p>
      ) : (
        <ol className="space-y-2">
          {ranking.data?.map((row, idx) => {
            const position = idx + 1
            const isMe = row.user_id === myId
            const ceremonial: CeremonialPosition | null =
              positionFromRank(position)
            const podiumToken = ceremonial
              ? positionColorToken(ceremonial)
              : null
            const accentStyle = podiumToken
              ? ({
                  '--accent-c': `hsl(var(--${podiumToken}))`,
                } as React.CSSProperties)
              : undefined

            return (
              <li
                key={row.user_id}
                style={accentStyle}
                className={cn(
                  'animate-float-in relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur-sm transition-all duration-200',
                  // Top 3: card inteiro tonalizado (mais cerimonial)
                  ceremonial === 'gold' &&
                    'animate-gold-shimmer border-gold/40 bg-gold/10',
                  ceremonial === 'silver' && 'border-silver/40 bg-silver/10',
                  ceremonial === 'bronze' && 'border-bronze/40 bg-bronze/10',
                  // Não-podium
                  !ceremonial && 'border-border/60',
                  // Highlight do user logado (overlay sutil mantém)
                  isMe && !ceremonial && 'border-primary/50 bg-primary/5',
                )}
              >
                {ceremonial && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1.5 [background-color:var(--accent-c)]"
                  />
                )}
                <div className="w-6 shrink-0 text-center">
                  <PositionMarker position={position} />
                </div>
                <Avatar
                  seed={row.avatar_seed ?? ''}
                  style={
                    (row.avatar_style as AvatarStyle | null) ?? AVATAR_STYLE
                  }
                  size={40}
                  className={cn(
                    'size-10',
                    ceremonial === 'gold' && 'ring-2 ring-gold/60',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {row.display_name ?? '—'}
                    {isMe && (
                      <span className="ml-2 text-xs text-primary">(você)</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'font-display text-2xl font-bold tabular-nums',
                      ceremonial && '[color:var(--accent-c)]',
                    )}
                  >
                    {row.total_points ?? 0}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    pts
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

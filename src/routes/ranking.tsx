import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minus,
  Trophy,
  Medal,
  Award,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { RankingListSkeleton } from '@/components/RankingRowSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { useRanking, type RankingRow } from '@/hooks/useRanking'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { usePageBackground } from '@/hooks/usePageBackground'
import { AVATAR_STYLE, type AvatarStyle } from '@/lib/dicebear'
import {
  positionColorToken,
  positionFromRank,
  type CeremonialPosition,
} from '@/lib/groupColors'
import { cn } from '@/lib/utils'

// Ícone decorativo de fundo por posição do pódio (distinto por colocação).
const DECO_ICON: Record<CeremonialPosition, LucideIcon> = {
  gold: Trophy,
  silver: Medal,
  bronze: Award,
}

function PositionMarker({
  position,
  ceremonial,
}: {
  position: number
  ceremonial: CeremonialPosition | null
}) {
  // Número da posição na MESMA fonte dos pontos (display/black/tabular); top 3
  // na cor cerimonial (igual ao placar de pontos), demais em muted.
  return (
    <span
      className={cn(
        'font-display text-xl font-black tabular-nums',
        ceremonial ? '[color:var(--accent-c)]' : 'text-muted-foreground',
      )}
    >
      {position}
    </span>
  )
}

/**
 * Compact position-movement indicator since the last scoring run. Visual only
 * (aria-hidden) — the movement is voiced through the row's aria-label.
 * Hidden entirely for new users (`delta == null`) to avoid noise.
 */
function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta == null) return null
  if (delta === 0) {
    return (
      <Minus aria-hidden className="size-3 shrink-0 text-muted-foreground/60" />
    )
  }
  const up = delta > 0
  const Icon = up ? ChevronUp : ChevronDown
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
        up ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {Math.abs(delta)}
    </span>
  )
}

interface RowMeta {
  position: number
  ceremonial: CeremonialPosition | null
  isMe: boolean
  tiedByPoints: boolean
  tiedByExactToo: boolean
}

/**
 * Inner content of a ranking row, shared between the list `<Link>` and the
 * sticky "your position" bar. Layout only — the wrapping element owns
 * navigation/interaction.
 */
function RankingRowContent({
  row,
  meta,
  showYouLabel = true,
}: {
  row: RankingRow
  meta: RowMeta
  showYouLabel?: boolean
}) {
  const { t } = useTranslation('ranking')
  const { t: tCommon } = useTranslation('common')
  const { position, ceremonial, isMe, tiedByPoints, tiedByExactToo } = meta

  const isLeader = ceremonial === 'gold'
  const DecoIcon = ceremonial ? DECO_ICON[ceremonial] : null

  return (
    <>
      {/* Medalha decorativa no fundo (só pódio), entre o meio e a direita da
          linha — na cor cerimonial, bem sutil. -z-10 + isolate na linha mantém
          o conteúdo por cima; overflow-hidden recorta o excedente. */}
      {DecoIcon && (
        <DecoIcon
          aria-hidden
          className="pointer-events-none absolute right-12 top-1/2 -z-10 size-20 -translate-y-1/2 -rotate-12 [color:var(--accent-c)] opacity-[0.12]"
        />
      )}
      {/* Tile de destaque à esquerda: tonal da cor cerimonial no pódio, neutro
          no resto. Estica na altura da linha (self-stretch). */}
      <div
        className={cn(
          'flex w-9 shrink-0 items-center justify-center self-stretch rounded-xl',
          ceremonial === 'gold' && 'bg-gold/15',
          ceremonial === 'silver' && 'bg-silver/15',
          ceremonial === 'bronze' && 'bg-bronze/15',
          !ceremonial && 'bg-muted',
        )}
        aria-hidden
      >
        <PositionMarker position={position} ceremonial={ceremonial} />
      </div>
      <Avatar
        seed={row.avatar_seed ?? ''}
        style={(row.avatar_style as AvatarStyle | null) ?? AVATAR_STYLE}
        size={isLeader ? 48 : 40}
        className={cn(
          'size-10',
          // Leader (1st) is visually heavier than 2nd/3rd to build hierarchy.
          isLeader && 'size-12 ring-2 ring-gold/60',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {row.display_name ?? '—'}
          {isMe && showYouLabel && (
            <span className="ml-2 text-xs text-primary">{tCommon('you')}</span>
          )}
        </div>
        {tiedByPoints && (
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {t('tiebreaker')}{' '}
            <span className="font-display tabular-nums text-foreground/70">
              {row.exact_count}
            </span>{' '}
            {t('exactUnit', { count: row.exact_count })}
            {tiedByExactToo && (
              <>
                {' · '}
                <span className="font-display tabular-nums text-foreground/70">
                  {row.scored_count}
                </span>{' '}
                {t('scoredUnit', { count: row.scored_count })}
              </>
            )}
          </div>
        )}
      </div>
      <DeltaIndicator delta={row.delta} />
      <div className="text-right">
        <div
          className={cn(
            'font-display text-2xl font-bold tabular-nums',
            // Leader's score scales up to top the 1 > 2 > 3 hierarchy.
            isLeader && 'text-3xl',
            ceremonial && '[color:var(--accent-c)]',
          )}
        >
          {row.total_points ?? 0}
        </div>
        <div className="text-[10px] uppercase text-muted-foreground">
          {t('pts')}
        </div>
      </div>
    </>
  )
}

/** Tailwind classes for the row container shared by list rows and sticky bar. */
function rowClasses(
  ceremonial: CeremonialPosition | null,
  isMe: boolean,
  extra?: string,
) {
  return cn(
    'relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur-sm',
    ceremonial === 'gold' && 'animate-gold-shimmer border-gold/40 bg-gold/10',
    ceremonial === 'silver' && 'border-silver/40 bg-silver/10',
    ceremonial === 'bronze' && 'border-bronze/40 bg-bronze/10',
    !ceremonial && 'border-border/60',
    // Subtle tonal overlay for self when NOT on podium (podium keeps its tone).
    isMe && !ceremonial && 'border-primary/50 bg-primary/5',
    // Always reinforce "you" with a primary ring — coexists with the podium
    // tone and the gold avatar ring without competing for the border.
    isMe && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
    extra,
  )
}

function accentStyleFor(
  ceremonial: CeremonialPosition | null,
): React.CSSProperties | undefined {
  if (!ceremonial) return undefined
  return {
    '--accent-c': `hsl(var(--${positionColorToken(ceremonial)}))`,
  } as React.CSSProperties
}

function buildMeta(rows: RankingRow[], idx: number, myId?: string): RowMeta {
  const row = rows[idx]
  const position = idx + 1
  const prev = rows[idx - 1]
  const next = rows[idx + 1]
  const tiedByPoints =
    (!!prev && prev.total_points === row.total_points) ||
    (!!next && next.total_points === row.total_points)
  const tiedByExactToo =
    tiedByPoints &&
    ((!!prev &&
      prev.total_points === row.total_points &&
      prev.exact_count === row.exact_count) ||
      (!!next &&
        next.total_points === row.total_points &&
        next.exact_count === row.exact_count))
  return {
    position,
    ceremonial: positionFromRank(position),
    isMe: row.user_id === myId,
    tiedByPoints,
    tiedByExactToo,
  }
}

function detailsHrefFor(row: RankingRow, isMe: boolean) {
  if (row.user_id == null) return '#'
  return isMe ? '/me/predictions' : `/u/${row.user_id}/predictions`
}

/** Builds a semantic aria-label for a ranking row (read instead of children). */
function useRowAria() {
  const { t } = useTranslation('ranking')
  return (row: RankingRow, meta: RowMeta) => {
    const base = t(meta.isMe ? 'rowAriaYou' : 'rowAria', {
      position: meta.position,
      name: row.display_name ?? '—',
      points: row.total_points ?? 0,
    })
    if (row.delta == null) return base
    const movement =
      row.delta === 0
        ? t('deltaSame')
        : row.delta > 0
          ? t('deltaUp', { count: row.delta })
          : t('deltaDown', { count: Math.abs(row.delta) })
    return `${base}, ${movement}`
  }
}

export function RankingPage() {
  const auth = useAuth()
  const ranking = useRanking()
  const myId = auth.session?.user.id
  const { t } = useTranslation('ranking')
  const { t: tCommon } = useTranslation('common')
  const rowAria = useRowAria()

  useRealtimeInvalidator({
    tables: ['scores'],
    queryKeys: [['ranking']],
  })
  usePageBackground('ranking')

  const myRowRef = useRef<HTMLLIElement>(null)
  const [myRowVisible, setMyRowVisible] = useState(true)

  const rows = ranking.data
  const myIndex = rows?.findIndex((r) => r.user_id === myId) ?? -1
  const myRow = myIndex >= 0 ? rows![myIndex] : null

  // Observe whether the user's own row is in the viewport. When it scrolls out,
  // we reveal the sticky "your position" bar.
  useEffect(() => {
    const el = myRowRef.current
    if (!el) {
      setMyRowVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setMyRowVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [myRow?.user_id, rows?.length])

  const scrollToMyRow = useCallback(() => {
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const showStickyBar = !!myRow && !myRowVisible
  const myMeta: RowMeta = {
    position: myIndex + 1,
    ceremonial: positionFromRank(myIndex + 1),
    isMe: true,
    tiedByPoints: false,
    tiedByExactToo: false,
  }

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('subtitle')}
        accent="gold"
      />

      {ranking.isPending ? (
        <RankingListSkeleton rows={8} />
      ) : ranking.isError ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {tCommon('errors.generic')}: {(ranking.error as Error).message}
        </p>
      ) : rows?.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ol className="space-y-2">
          {rows?.map((row, idx) => {
            const meta = buildMeta(rows, idx, myId)
            return (
              <li key={row.user_id} ref={meta.isMe ? myRowRef : undefined}>
                <Link
                  to={detailsHrefFor(row, meta.isMe)}
                  aria-label={rowAria(row, meta)}
                  style={accentStyleFor(meta.ceremonial)}
                  className={rowClasses(
                    meta.ceremonial,
                    meta.isMe,
                    'animate-float-in transition-all duration-200 hover:bg-card active:scale-[0.99]',
                  )}
                >
                  <RankingRowContent row={row} meta={meta} />
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground/40"
                  />
                </Link>
              </li>
            )
          })}
        </ol>
      )}

      {showStickyBar && myRow && (
        <div className="safe-bottom pointer-events-none sticky bottom-0 z-20 -mx-4 px-4 pb-2">
          <button
            type="button"
            onClick={scrollToMyRow}
            aria-label={`${t('goToMyRow')} · ${rowAria(myRow, myMeta)}`}
            style={accentStyleFor(myMeta.ceremonial)}
            className={rowClasses(
              myMeta.ceremonial,
              true,
              'animate-float-in pointer-events-auto min-h-11 w-full text-left shadow-lg backdrop-blur-md active:scale-[0.99]',
            )}
          >
            <RankingRowContent row={myRow} meta={myMeta} showYouLabel={false} />
            <span
              aria-hidden
              className="ml-1 shrink-0 text-[10px] font-medium uppercase tracking-wide text-primary"
            >
              {t('youLabel')}
            </span>
          </button>
        </div>
      )}
    </section>
  )
}

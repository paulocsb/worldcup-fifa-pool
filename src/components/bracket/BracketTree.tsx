import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BracketNode } from './BracketNode'
import { PredictionSheet } from '@/components/PredictionSheet'
import { SubTabs } from '@/components/SubTabs'
import { Surface } from '@/components/Surface'
import { useAuth } from '@/hooks/useAuth'
import { useMyPredictions } from '@/hooks/usePredictions'
import {
  useBracketNodes,
  type BracketNodeItem,
} from '@/hooks/useBracketNodes'
import type { MatchWithTeams } from '@/hooks/useMatches'
import {
  FINAL_REF,
  THIRD_PLACE_REF,
  SEMI_FINAL_LEFT_REF,
  SEMI_FINAL_RIGHT_REF,
  HALF_STAGE_COLUMNS,
  halfBracketColumns,
  type BracketHalf,
} from '@/lib/bracketStructure'
import type { Prediction } from '@/types/db'

type Segment = BracketHalf | 'final'
const SEGMENTS: ReadonlyArray<Segment> = ['left', 'right', 'final']

function segmentFromParam(value: string | null): Segment {
  return value === 'left' || value === 'right' || value === 'final'
    ? value
    : 'left'
}

/**
 * Tree-shaped bracket (Phase 2.2) — ADDITIVE to the per-phase card lists. Splits
 * the 16-game knockout into two HALF-BRACKET sub-trees (R32→R16→QF→SF) that only
 * meet at the Final, plus a dedicated Final segment (SF101 · SF102 → Final, with
 * the third-place play-off aside).
 *
 * Halves are DERIVED from the config (see bracketStructure: traversal from both
 * semi-finals via `winnerOf`), never hardcoded. Each half is a 4-column grid
 * (8→4→2→1) with FIXED-height nodes, so the CSS connectors between columns line
 * up deterministically. Scroll is vertical only; widths fit 320px.
 *
 * Tapping a node with a real fixture opens the PredictionSheet (same interaction
 * as the cards). The accessible primary path remains the per-phase lists.
 */
export function BracketTree() {
  const { t } = useTranslation('standings')
  const auth = useAuth()
  const nodes = useBracketNodes()
  const predictions = useMyPredictions(auth.session?.user.id)
  const [params, setParams] = useSearchParams()
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  const segment = segmentFromParam(params.get('half'))

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  function handleSelect(item: BracketNodeItem) {
    if (item.dbMatch) setActive(item.dbMatch)
  }

  function handleChangeSegment(next: Segment) {
    const p = new URLSearchParams(params)
    p.set('half', next)
    setParams(p, { replace: true })
  }

  const segmentTabs = SEGMENTS.map((slug) => ({
    slug,
    label: t(
      slug === 'left'
        ? 'bracket.halfLeft'
        : slug === 'right'
          ? 'bracket.halfRight'
          : 'bracket.halfFinal',
    ),
  }))

  return (
    <div className="space-y-4">
      <SubTabs
        tabs={segmentTabs}
        active={segment}
        onChange={handleChangeSegment}
      />

      {nodes.isPending ? (
        <Surface
          variant="dashed"
          padding="none"
          className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"
        >
          <Loader2 className="size-5 animate-spin" />
          {t('bracket.treeLoading')}
        </Surface>
      ) : nodes.isError ? (
        <Surface
          variant="notice"
          tone="destructive"
          as="p"
          className="text-sm"
          role="alert"
          aria-live="polite"
        >
          {t('loadError', { message: nodes.error?.message ?? '' })}
        </Surface>
      ) : segment === 'final' ? (
        <FinalSegment byRef={nodes.byRef} onSelect={handleSelect} />
      ) : (
        <HalfSegment
          half={segment}
          byRef={nodes.byRef}
          onSelect={handleSelect}
        />
      )}

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={auth.session?.user.id}
        onClose={() => setActive(null)}
      />
    </div>
  )
}

/**
 * One half of the bracket as a 4-column grid (R32→R16→QF→SF). Each column is a
 * vertical flex with `justify-around`: every node centers within an equal slice
 * of the column height, so column N's node aligns to the midpoint of its two
 * feeders in column N-1 (8→4→2→1). Connectors are CSS pseudo-elements on a
 * wrapper per node — no SVG.
 */
function HalfSegment({
  half,
  byRef,
  onSelect,
}: {
  half: BracketHalf
  byRef: ReadonlyMap<number, BracketNodeItem>
  onSelect: (item: BracketNodeItem) => void
}) {
  const { t } = useTranslation('standings')
  const columns = useMemo(() => halfBracketColumns(half), [half])

  const hasAny = columns.some((c) =>
    c.refs.some((ref) => byRef.has(ref)),
  )
  if (!hasAny) {
    return <TreeEmpty message={t('bracket.emptyR32')} />
  }

  return (
    <div
      className="grid items-stretch gap-x-1"
      style={{
        gridTemplateColumns: `repeat(${HALF_STAGE_COLUMNS.length}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column.stage}
          className="flex flex-col justify-around gap-2"
        >
          {column.refs.map((ref) => {
            const item = byRef.get(ref)
            if (!item) return null
            return (
              <ConnectedNode
                key={ref}
                item={item}
                onSelect={onSelect}
                // First column has no inbound connector; last has no outbound.
                hasInbound={colIndex > 0}
                hasOutbound={colIndex < HALF_STAGE_COLUMNS.length - 1}
                half={half}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * Wraps a BracketNode with subtle connector stubs. Because every node has fixed
 * height and `justify-around` centers it in its column slice, a short horizontal
 * stub on the outbound side + a vertical rail on the inbound side reads as the
 * classic bracket join without SVG. Mirrored for the right half.
 */
function ConnectedNode({
  item,
  onSelect,
  hasInbound,
  hasOutbound,
  half,
}: {
  item: BracketNodeItem
  onSelect: (item: BracketNodeItem) => void
  hasInbound: boolean
  hasOutbound: boolean
  half: BracketHalf
}) {
  const { t } = useTranslation('standings')
  const mirror = half === 'right'

  return (
    <div
      className="relative flex items-center"
      aria-label={confrontAriaLabel(item, t)}
    >
      {/* Inbound stub (from previous column). On the right half it sits on the
          opposite side so the tree fans inward toward the Final. */}
      {hasInbound && (
        <span
          aria-hidden
          className={mirror ? 'order-3 ml-0.5' : '-order-1 mr-0.5'}
          style={connectorStubStyle}
        />
      )}
      <div className="min-w-0 flex-1">
        <BracketNode item={item} size="sm" onSelect={onSelect} />
      </div>
      {/* Outbound stub (toward next column). */}
      {hasOutbound && (
        <span
          aria-hidden
          className={mirror ? '-order-2 mr-0.5' : 'order-3 ml-0.5'}
          style={connectorStubStyle}
        />
      )}
    </div>
  )
}

const connectorStubStyle = {
  width: '0.25rem',
  height: '1px',
  flexShrink: 0,
  backgroundColor: 'hsl(var(--border))',
} as const

/**
 * Final segment: the two semi-finals stacked, feeding the Final, with the
 * third-place play-off shown apart. No half-grid here — each matchup uses the
 * SAME compact `BracketNode` as the halves, centered (never stretched
 * full-width) so the sides hug the central game number. Always fits 320px.
 */
function FinalSegment({
  byRef,
  onSelect,
}: {
  byRef: ReadonlyMap<number, BracketNodeItem>
  onSelect: (item: BracketNodeItem) => void
}) {
  const { t } = useTranslation('standings')
  const sf1 = byRef.get(SEMI_FINAL_LEFT_REF)
  const sf2 = byRef.get(SEMI_FINAL_RIGHT_REF)
  const final = byRef.get(FINAL_REF)
  const third = byRef.get(THIRD_PLACE_REF)

  if (!sf1 && !sf2 && !final) {
    return <TreeEmpty message={t('bracket.emptySF')} />
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <FinalLabel>{t('bracket.finalSemis')}</FinalLabel>
        <div className="space-y-3">
          {sf1 && <CenteredNode item={sf1} onSelect={onSelect} t={t} />}
          {sf2 && <CenteredNode item={sf2} onSelect={onSelect} t={t} />}
        </div>
      </section>

      {final && (
        <section className="space-y-3">
          <FinalLabel>{t('bracket.finalTitle')}</FinalLabel>
          <CenteredNode item={final} onSelect={onSelect} t={t} size="md" />
        </section>
      )}

      {third && (
        <section className="space-y-3">
          <FinalLabel>{t('bracket.thirdPlace')}</FinalLabel>
          <CenteredNode item={third} onSelect={onSelect} t={t} />
        </section>
      )}
    </div>
  )
}

/**
 * A single compact `BracketNode` constrained and centered — the same tile used
 * in the half-bracket columns, so the Final segment reads consistently instead
 * of stretching the two sides to the screen edges.
 */
function CenteredNode({
  item,
  onSelect,
  t,
  size = 'sm',
}: {
  item: BracketNodeItem
  onSelect: (item: BracketNodeItem) => void
  t: ReturnType<typeof useTranslation>['t']
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className="mx-auto max-w-[18rem]"
      aria-label={confrontAriaLabel(item, t)}
    >
      <BracketNode item={item} size={size} onSelect={onSelect} />
    </div>
  )
}

function FinalLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

function TreeEmpty({ message }: { message: string }) {
  return (
    <Surface
      variant="dashed"
      padding="none"
      className="animate-float-in flex flex-col items-center gap-3 p-8 text-center"
    >
      <Loader2 className="size-6 text-muted-foreground/60" />
      <p className="max-w-xs text-balance text-sm text-muted-foreground">
        {message}
      </p>
    </Surface>
  )
}

/** Short, screen-reader-friendly summary of a matchup. */
function confrontAriaLabel(
  item: BracketNodeItem,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const home = item.resolvedHome?.code ?? t('bracket.tba')
  const away = item.resolvedAway?.code ?? t('bracket.tba')
  return t('bracket.confrontAria', {
    number: item.bracket.ref,
    home,
    away,
  })
}

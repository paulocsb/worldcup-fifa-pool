import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BracketNode } from './BracketNode'
import { PhasePill } from '@/components/PhasePill'
import type { BracketNodeItem } from '@/hooks/useBracketNodes'
import {
  FINAL_REF,
  THIRD_PLACE_REF,
  HALF_STAGE_COLUMNS,
  halfBracketColumns,
  type BracketHalf,
} from '@/lib/bracketStructure'
import { accentVarStyle, phaseColorToken } from '@/lib/groupColors'
import type { MatchStage } from '@/types/db'

/**
 * FULL poster bracket (Phase 2.3) — the entire 16-game knockout laid out on a
 * single wide canvas, mirrored around a central Final column, exactly like the
 * official FIFA wall chart:
 *
 *   L-R32 → L-R16 → L-QF → L-SF │ FINAL (+ 3rd) │ R-SF ← R-QF ← R-R16 ← R-R32
 *
 * It does NOT try to fit a phone width — it has generous "natural" dimensions
 * and is meant to live inside the zoom/pan viewport (BracketFullModal). The
 * left/right column orderings reuse the SAME tree (DFS) ordering as the existing
 * half view (`halfBracketColumns`), so feeders pair correctly (game 89 sits
 * between 74 and 77, not 73/74).
 *
 * Vertical alignment is deterministic: every column is a flex column with
 * `justify-around` inside a FIXED-height canvas, so column N's node lands at the
 * midpoint of its two feeders (8→4→2→1). CSS connector stubs (no SVG) read as
 * the classic bracket join; the right half mirrors them.
 */

/**
 * Width of a single round column (px). Tuned so a 3-letter code + flag fits even
 * after BOTH connector stubs (inbound + outbound) are reserved on every node.
 */
const COLUMN_WIDTH = 190
/** Width of the central Final/3rd column. */
const CENTER_WIDTH = 216
/**
 * Canvas height (px). 8 R32 rows × ~node height, tuned so the column with the
 * MOST nodes (R32, 8 rows) fills the canvas with `justify-around` spacing
 * without leaving dead vertical space the FIT would otherwise enframe.
 */
const CANVAS_HEIGHT = 560

export function BracketFullView({
  byRef,
  onSelect,
}: {
  byRef: ReadonlyMap<number, BracketNodeItem>
  onSelect: (item: BracketNodeItem) => void
}) {
  const { t } = useTranslation('standings')
  const left = useMemo(() => halfBracketColumns('left'), [])
  const right = useMemo(() => halfBracketColumns('right'), [])

  const final = byRef.get(FINAL_REF)
  const third = byRef.get(THIRD_PLACE_REF)

  return (
    <div
      // select-none: pan/tap gestures must never highlight node text (the
      // game number / TBD) on touch.
      className="flex select-none items-stretch gap-1 p-4"
      style={{ height: CANVAS_HEIGHT }}
    >
      {/* Left half: R32 → SF, fanning rightward. */}
      {left.map((column, colIndex) => (
        <RoundColumn
          key={`l-${column.stage}`}
          stage={column.stage}
          refs={column.refs}
          byRef={byRef}
          onSelect={onSelect}
          half="left"
          hasInbound={colIndex > 0}
          hasOutbound // SF feeds the central Final
          t={t}
        />
      ))}

      {/* Central column: Final on top, third-place play-off below. */}
      <CenterColumn final={final} third={third} onSelect={onSelect} t={t} />

      {/* Right half: SF → R32, fanning leftward (columns reversed + mirrored). */}
      {[...right].reverse().map((column, idx) => {
        // After reversing, idx 0 is the SF column (closest to center).
        const isLeaf = idx === right.length - 1 // R32, outermost
        return (
          <RoundColumn
            key={`r-${column.stage}`}
            stage={column.stage}
            refs={column.refs}
            byRef={byRef}
            onSelect={onSelect}
            half="right"
            hasInbound={!isLeaf}
            hasOutbound={idx === 0} // SF feeds the central Final
            t={t}
          />
        )
      })}
    </div>
  )
}

function RoundColumn({
  stage,
  refs,
  byRef,
  onSelect,
  half,
  hasInbound,
  hasOutbound,
  t,
}: {
  stage: MatchStage
  refs: ReadonlyArray<number>
  byRef: ReadonlyMap<number, BracketNodeItem>
  onSelect: (item: BracketNodeItem) => void
  half: BracketHalf
  hasInbound: boolean
  hasOutbound: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div
      // Banda sutil na cor da fase (canais HSL crus em --accent-c → alpha
      // funciona, evita o gotcha de /opacity com var()).
      className="flex shrink-0 flex-col rounded-2xl bg-[hsl(var(--accent-c)_/_0.07)] py-2"
      style={{ width: COLUMN_WIDTH, ...accentVarStyle(phaseColorToken(stage)) }}
    >
      <ColumnHeader stage={stage} half={half} />
      <div className="flex flex-1 flex-col justify-around gap-2">
        {refs.map((ref) => {
          const item = byRef.get(ref)
          if (!item) return null
          return (
            <ConnectedNode
              key={ref}
              item={item}
              onSelect={onSelect}
              hasInbound={hasInbound}
              hasOutbound={hasOutbound}
              half={half}
              t={t}
            />
          )
        })}
      </div>
    </div>
  )
}

function CenterColumn({
  final,
  third,
  onSelect,
  t,
}: {
  final: BracketNodeItem | undefined
  third: BracketNodeItem | undefined
  onSelect: (item: BracketNodeItem) => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div
      className="flex shrink-0 flex-col justify-center gap-6 px-1"
      style={{ width: CENTER_WIDTH }}
    >
      {/* FIFA portrait brand mark — apex of the chart. White asset hardcoded:
          the modal forces a dark background, so the prefers-color-scheme logo
          (FifaLogo) would render black/invisible on a light-themed device. */}
      <img
        src="/fifa-logo-white.png"
        alt=""
        aria-hidden
        draggable={false}
        className="mx-auto mb-4 h-16 w-auto select-none opacity-90 drop-shadow"
      />

      <section
        className="space-y-2 rounded-2xl bg-[hsl(var(--accent-c)_/_0.07)] px-2 py-3"
        style={accentVarStyle(phaseColorToken('final'))}
      >
        <h3 className="text-center font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('bracket.finalTitle')}
        </h3>
        {final ? (
          <div aria-label={confrontAriaLabel(final, t)}>
            <BracketNode item={final} size="md" onSelect={onSelect} />
          </div>
        ) : (
          <CenterPlaceholder message={t('bracket.emptySF')} />
        )}
      </section>

      <section
        className="space-y-2 rounded-2xl bg-[hsl(var(--accent-c)_/_0.07)] px-2 py-3"
        style={accentVarStyle(phaseColorToken('third_place'))}
      >
        <h3 className="text-center font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {t('bracket.thirdPlace')}
        </h3>
        {third ? (
          <div aria-label={confrontAriaLabel(third, t)}>
            <BracketNode item={third} size="sm" onSelect={onSelect} />
          </div>
        ) : (
          <CenterPlaceholder message={t('bracket.emptySF')} />
        )}
      </section>
    </div>
  )
}

function CenterPlaceholder({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-3 text-center text-[11px] text-muted-foreground">
      {message}
    </p>
  )
}

function ColumnHeader({
  stage,
  half,
}: {
  stage: MatchStage
  half: BracketHalf
}) {
  return (
    <div
      className={
        // px-3: respiro da borda da banda (o pill não cola no canto
        // arredondado). justify segue o espelhamento da chave (esq/dir).
        half === 'right'
          ? 'mb-2 flex justify-end px-3'
          : 'mb-2 flex justify-start px-3'
      }
    >
      <PhasePill stage={stage} variant="tinted" size="sm" />
    </div>
  )
}

/**
 * Wraps a BracketNode with subtle connector stubs. Mirrored for the right half
 * so the tree fans inward toward the central Final — identical approach to the
 * legacy half view, kept deterministic by the fixed-height `justify-around`
 * columns.
 */
function ConnectedNode({
  item,
  onSelect,
  hasInbound,
  hasOutbound,
  half,
  t,
}: {
  item: BracketNodeItem
  onSelect: (item: BracketNodeItem) => void
  hasInbound: boolean
  hasOutbound: boolean
  half: BracketHalf
  t: ReturnType<typeof useTranslation>['t']
}) {
  const mirror = half === 'right'
  // Cada nó reserva SEMPRE as duas perninhas (a linha só aparece quando há
  // conector). Com COLUMN_WIDTH alargado pra caber bandeira + 2 perninhas, os
  // 32-avos (sem linha de entrada) alinham com as demais fases sem truncar.
  return (
    <div
      className="relative flex items-center"
      aria-label={confrontAriaLabel(item, t)}
    >
      <span
        aria-hidden
        className={mirror ? 'order-3 ml-1' : '-order-1 mr-1'}
        style={hasInbound ? connectorStubStyle : connectorSpacerStyle}
      />
      <div className="min-w-0 flex-1">
        <BracketNode item={item} size="sm" onSelect={onSelect} />
      </div>
      <span
        aria-hidden
        className={mirror ? '-order-2 mr-1' : 'order-3 ml-1'}
        style={hasOutbound ? connectorStubStyle : connectorSpacerStyle}
      />
    </div>
  )
}

const connectorStubStyle = {
  width: '0.75rem',
  height: '1px',
  flexShrink: 0,
  backgroundColor: 'hsl(var(--border))',
} as const

/** Same footprint as the stub but invisible — keeps every node the same width. */
const connectorSpacerStyle = {
  width: '0.75rem',
  height: '1px',
  flexShrink: 0,
} as const

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

/** Natural canvas size, exported so the modal can compute the FIT scale. */
export const BRACKET_CANVAS = {
  width: COLUMN_WIDTH * (HALF_STAGE_COLUMNS.length * 2) + CENTER_WIDTH + 32,
  height: CANVAS_HEIGHT,
} as const

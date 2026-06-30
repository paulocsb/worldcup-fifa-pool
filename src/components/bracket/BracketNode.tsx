import { useTranslation } from 'react-i18next'
import { Surface } from '@/components/Surface'
import { TeamFlag } from '@/components/TeamFlag'
import { useTeamName } from '@/lib/teamI18n'
import type { BracketNodeItem } from '@/hooks/useBracketNodes'
import { formatSlotLabelShort, type BracketSlot } from '@/lib/bracketStructure'
import { bracketNodeCenter } from '@/lib/bracketNodeCenter'
import { timeOfDay } from '@/lib/format'
import { phaseColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import type { Team } from '@/types/db'

interface BracketNodeProps {
  item: BracketNodeItem
  /** Compact (tree default) vs slightly roomier. Default 'md'. */
  size?: 'sm' | 'md'
  /**
   * Tappable when the matchup has a real fixture (`dbMatch`). The tree (2.2)
   * wires this to open the PredictionSheet; the sheet is NOT owned here.
   */
  onSelect?: (item: BracketNodeItem) => void
  className?: string
}

/**
 * Compact knockout tile for the tree-shaped bracket (Phase 2.2). FIXED height
 * (`h-14` / `h-12`) so the CSS connectors between rounds line up — long labels
 * are truncated, never wrapped.
 *
 * Each side = ~20px flag + 3-letter code when the team is resolved, OR a short,
 * truncated slot label (`formatSlotLabel`) when still predicted. The official
 * game number sits discreetly between the two sides, with the kickoff time (or
 * "TBD") under it. Phase accent on the border via Surface's `--accent-c`
 * channels (gotcha-safe).
 *
 * Tap target: the whole tile is ≥44px tall and, when `dbMatch` + `onSelect`
 * exist, becomes a real <button> with tactile feedback.
 */
export function BracketNode({
  item,
  size = 'md',
  onSelect,
  className,
}: BracketNodeProps) {
  const { bracket, dbMatch } = item

  const accentToken = phaseColorToken(bracket.stage)
  const heightClass = size === 'sm' ? 'h-12' : 'h-14'
  const tappable = Boolean(dbMatch && onSelect)

  return (
    <Surface
      as="div"
      variant="tonal"
      accent={accentToken}
      padding="none"
      interactive={tappable}
      className={cn(
        'relative overflow-hidden',
        !dbMatch && 'border-dashed',
        className,
      )}
    >
      {tappable ? (
        <button
          type="button"
          onClick={() => onSelect?.(item)}
          className={cn(
            'flex w-full items-stretch text-left',
            heightClass,
            'active:scale-[0.98]',
          )}
        >
          <NodeBody item={item} />
        </button>
      ) : (
        <div className={cn('flex items-stretch', heightClass)}>
          <NodeBody item={item} />
        </div>
      )}
    </Surface>
  )
}

function NodeBody({ item }: { item: BracketNodeItem }) {
  const { bracket, resolvedHome, resolvedAway } = item

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1 px-2">
      <NodeSide slot={bracket.home} team={resolvedHome} />

      {/* Center spine: discreet game number + score / kickoff / TBD. */}
      <div className="flex shrink-0 flex-col items-center justify-center px-1 leading-none">
        <span className="font-display text-[10px] font-bold tabular-nums text-muted-foreground/70">
          {bracket.ref}
        </span>
        <NodeCenter item={item} />
      </div>

      <NodeSide slot={bracket.away} team={resolvedAway} mirror />
    </div>
  )
}

/**
 * Center sub-line(s) under the game number. Three states, in priority order:
 *  1. matched fixture FINISHED → the real score (`H–A`), winner side in
 *     `text-primary`. A penalty shootout is shown on its OWN line below (small,
 *     muted) — NOT inline — so the center `auto` column stays as narrow as a
 *     normal "1–1" and never steals width from the 3-letter team codes (which
 *     would otherwise truncate to "G…"). Winner convention via `knockoutResult`.
 *  2. matched fixture NOT finished (scheduled/live) → kickoff `HH:mm` from the
 *     fixture itself (this is why we read `dbMatch.kickoff_at`, not `item.kickoffAt`:
 *     the latter is only populated for PREDICTED matchups, by design).
 *  3. predicted matchup (no fixture) → `item.kickoffAt` time if a fixture lent its
 *     kickoff, else `TBD` (unchanged legacy behavior).
 *
 * All lines are `tabular-nums` + `whitespace-nowrap`; three short lines fit the
 * fixed `h-12`/`h-14` height the CSS connectors depend on.
 */
function NodeCenter({ item }: { item: BracketNodeItem }) {
  const { t } = useTranslation('standings')
  const center = bracketNodeCenter(item)

  if (center.kind === 'score') {
    return (
      <>
        <span className="flex items-center gap-0.5 font-display text-[11px] font-black leading-none tabular-nums">
          <span className={cn(center.homeWins && 'text-primary')}>
            {center.home}
          </span>
          <span className="text-muted-foreground/50">–</span>
          <span className={cn(center.awayWins && 'text-primary')}>
            {center.away}
          </span>
        </span>
        {center.penalties && (
          <span className="whitespace-nowrap font-display text-[9px] font-bold leading-none tabular-nums text-muted-foreground">
            {t('bracket.penShort', {
              home: center.penalties.home,
              away: center.penalties.away,
            })}
          </span>
        )}
      </>
    )
  }

  const time =
    center.kind === 'time' ? timeOfDay(center.kickoffAt) : t('bracket.timeTbd')

  return (
    <span className="font-display text-[10px] font-bold uppercase tabular-nums text-muted-foreground">
      {time}
    </span>
  )
}

/**
 * One side of the compact node. Resolved → 3-letter code + flag (~20px).
 * Predicted → truncated short slot label (e.g. "3º A/B/C/D/F"), single line.
 *
 * The CODE/label always sits on the OUTER edge (left side → left, right side →
 * right) with the flag tucked toward the center. This keeps the code anchored at
 * the same x-position whether or not a flag is present, so slot-only nodes
 * (e.g. "1º H") align their label to the same column as resolved nodes' codes.
 */
function NodeSide({
  slot,
  team,
  mirror,
}: {
  slot: BracketSlot
  team: Team | null
  mirror?: boolean
}) {
  const { t } = useTranslation('standings')
  const name = useTeamName(team)

  const code = team ? (
    <span
      className="font-display truncate text-sm font-black uppercase leading-none"
      title={name}
    >
      {team.code}
    </span>
  ) : (
    <span className="truncate font-display text-[11px] font-bold uppercase leading-none tracking-tight text-foreground/75">
      {formatSlotLabelShort(slot, t)}
    </span>
  )
  const flag = team ? <TeamFlag team={team} size={20} /> : null

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        // Code/label pinned to the OUTER edge; flag toward the center.
        // Home (left): [code][flag] justify-start. Away (right): [flag][code]
        // justify-end. Either way the code hugs the outer border.
        mirror ? 'justify-end' : 'justify-start',
      )}
    >
      {mirror ? (
        <>
          {flag}
          {code}
        </>
      ) : (
        <>
          {code}
          {flag}
        </>
      )}
    </div>
  )
}

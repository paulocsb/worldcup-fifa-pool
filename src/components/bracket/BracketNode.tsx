import { useTranslation } from 'react-i18next'
import { Surface } from '@/components/Surface'
import { TeamFlag } from '@/components/TeamFlag'
import { useTeamName } from '@/lib/teamI18n'
import type { BracketNodeItem } from '@/hooks/useBracketNodes'
import { formatSlotLabelShort, type BracketSlot } from '@/lib/bracketStructure'
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
  const { t } = useTranslation('standings')
  const { bracket, dbMatch, kickoffAt } = item

  const accentToken = phaseColorToken(bracket.stage)
  const heightClass = size === 'sm' ? 'h-12' : 'h-14'
  const tappable = Boolean(dbMatch && onSelect)
  const time = kickoffAt ? timeOfDay(kickoffAt) : t('bracket.timeTbd')

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
          <NodeBody item={item} time={time} />
        </button>
      ) : (
        <div className={cn('flex items-stretch', heightClass)}>
          <NodeBody item={item} time={time} />
        </div>
      )}
    </Surface>
  )
}

function NodeBody({ item, time }: { item: BracketNodeItem; time: string }) {
  const { bracket, resolvedHome, resolvedAway } = item

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1 px-2">
      <NodeSide slot={bracket.home} team={resolvedHome} />

      {/* Center spine: discreet game number + time/TBD. */}
      <div className="flex shrink-0 flex-col items-center justify-center px-1 leading-none">
        <span className="font-display text-[10px] font-bold tabular-nums text-muted-foreground/70">
          {bracket.ref}
        </span>
        <span className="font-display text-[10px] font-bold uppercase tabular-nums text-muted-foreground">
          {time}
        </span>
      </div>

      <NodeSide slot={bracket.away} team={resolvedAway} mirror />
    </div>
  )
}

/**
 * One side of the compact node. Resolved → flag (~20px) + 3-letter code.
 * Predicted → truncated short slot label (e.g. "3º A/B/C/D/F"), single line.
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

  const content = team ? (
    <>
      <TeamFlag team={team} size={20} />
      <span
        className="font-display truncate text-sm font-black uppercase leading-none"
        title={name}
      >
        {team.code}
      </span>
    </>
  ) : (
    <span className="truncate font-display text-[11px] font-bold uppercase leading-none tracking-tight text-foreground/75">
      {formatSlotLabelShort(slot, t)}
    </span>
  )

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        mirror ? 'flex-row-reverse justify-start' : 'justify-end',
      )}
    >
      {content}
    </div>
  )
}

import type { Team } from '@/types/db'
import { cn } from '@/lib/utils'
import { useTeamName } from '@/lib/teamI18n'
import { TeamFlag } from './TeamFlag'

interface TeamBadgeProps {
  team: Team | null
  align?: 'left' | 'right'
  size?: 'sm' | 'md'
  showCode?: boolean
  className?: string
}

export function TeamBadge({
  team,
  align = 'left',
  size = 'md',
  showCode = true,
  className,
}: TeamBadgeProps) {
  const flagSize = size === 'sm' ? 28 : 36
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const name = useTeamName(team)
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'right' && 'flex-row-reverse text-right',
        className,
      )}
    >
      <TeamFlag team={team} size={flagSize} />
      <div className={cn('min-w-0 leading-tight', textSize)}>
        <div className="truncate font-semibold">{name}</div>
        {showCode && team?.code && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {team.code}
          </div>
        )}
      </div>
    </div>
  )
}

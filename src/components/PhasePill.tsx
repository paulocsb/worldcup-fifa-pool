import {
  PHASE_LABEL_PT,
  PHASE_LABEL_SHORT_PT,
  phaseColorToken,
  phaseNeedsLightFg,
} from '@/lib/groupColors'
import type { MatchStage } from '@/types/db'
import { cn } from '@/lib/utils'

interface PhasePillProps {
  stage: MatchStage
  size?: 'sm' | 'md'
  short?: boolean
  variant?: 'solid' | 'tinted'
  className?: string
}

export function PhasePill({
  stage,
  size = 'md',
  short = false,
  variant = 'solid',
  className,
}: PhasePillProps) {
  const token = phaseColorToken(stage)
  const label = short ? PHASE_LABEL_SHORT_PT[stage] : PHASE_LABEL_PT[stage]
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-sm'
  const needsLight = phaseNeedsLightFg(stage)

  const styleVar = { '--c': `hsl(var(--${token}))` } as React.CSSProperties

  return (
    <span
      style={styleVar}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-display font-bold uppercase tracking-wider',
        pad,
        variant === 'solid' &&
          '[background-color:var(--c)] ' +
            (needsLight ? 'text-white' : 'text-[hsl(141_41%_10%)]'),
        variant === 'tinted' &&
          'border bg-[color:var(--c)]/10 [border-color:var(--c)] [color:var(--c)]',
        className,
      )}
    >
      {label}
    </span>
  )
}

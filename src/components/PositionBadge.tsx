import { Crown, Medal, Award } from 'lucide-react'
import { positionColorToken, type CeremonialPosition } from '@/lib/groupColors'
import { cn } from '@/lib/utils'

interface PositionBadgeProps {
  position: CeremonialPosition
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'tinted' | 'icon-only'
  showLabel?: boolean
  className?: string
}

const LABEL: Record<CeremonialPosition, string> = {
  gold: 'Campeão',
  silver: 'Vice',
  bronze: '3º lugar',
}

const ICON: Record<CeremonialPosition, typeof Crown> = {
  gold: Crown,
  silver: Medal,
  bronze: Award,
}

/**
 * Badge cerimonial para pódio (gold/silver/bronze).
 * variant='solid'    : pill cheio + ícone + texto
 * variant='tinted'   : pill borda + texto
 * variant='icon-only': só ícone colorido
 */
export function PositionBadge({
  position,
  size = 'md',
  variant = 'solid',
  showLabel = true,
  className,
}: PositionBadgeProps) {
  const token = positionColorToken(position)
  const Icon = ICON[position]
  const label = LABEL[position]
  const iconSize = size === 'sm' ? 'size-3' : size === 'lg' ? 'size-5' : 'size-4'
  const pad =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
        ? 'px-3 py-1.5 text-sm'
        : 'px-2.5 py-1 text-xs'

  const styleVar = { '--c': `hsl(var(--${token}))` } as React.CSSProperties

  if (variant === 'icon-only') {
    return (
      <Icon
        style={styleVar}
        className={cn(iconSize, '[color:var(--c)]', className)}
        aria-label={label}
      />
    )
  }

  return (
    <span
      style={styleVar}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-display font-bold uppercase tracking-wider',
        pad,
        variant === 'solid' &&
          'text-[hsl(var(--background))] [background-color:var(--c)]',
        variant === 'tinted' &&
          'border bg-[color:var(--c)]/10 [border-color:var(--c)] [color:var(--c)]',
        className,
      )}
    >
      <Icon className={iconSize} />
      {showLabel && label}
    </span>
  )
}

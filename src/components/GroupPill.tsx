import { useTranslation } from 'react-i18next'
import { groupColorToken, groupNeedsLightFg } from '@/lib/groupColors'
import { cn } from '@/lib/utils'

interface GroupPillProps {
  letter: string | null | undefined
  size?: 'sm' | 'md'
  variant?: 'solid' | 'tinted'
  className?: string
  withLabel?: boolean
}

export function GroupPill({
  letter,
  size = 'md',
  variant = 'solid',
  withLabel = true,
  className,
}: GroupPillProps) {
  const { t } = useTranslation()
  const token = groupColorToken(letter)
  if (!letter || !token) return null

  const upper = letter.toUpperCase()
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-sm'
  const needsLight = groupNeedsLightFg(letter)

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
      {withLabel ? `${t('group')} ${upper}` : upper}
    </span>
  )
}

import { Link } from 'react-router-dom'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricTone = 'primary' | 'gold' | 'emerald' | 'muted'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  hint?: string
  to?: string
  /**
   * `compact` (default) — vertical layout used by /profile.
   * `inline` — horizontal layout with tonal background and a large
   * decorative icon bleeding off the bottom-right corner. Used in /home.
   */
  variant?: 'compact' | 'inline'
  /** Color of the card surface, inline icon, and background decoration. */
  tone?: MetricTone
  className?: string
}

const TONE_CARD: Record<MetricTone, string> = {
  primary: 'border-primary/30 bg-primary/[0.08]',
  gold: 'border-gold/40 bg-gold/[0.09]',
  emerald:
    'border-emerald-500/30 bg-emerald-500/[0.08] dark:border-emerald-400/30',
  muted: 'border-border/60 bg-card/80',
}

const TONE_ICON: Record<MetricTone, string> = {
  primary: 'text-primary',
  gold: 'text-gold',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  muted: 'text-muted-foreground',
}

const TONE_DECO: Record<MetricTone, string> = {
  primary: 'text-primary/20',
  gold: 'text-gold/20',
  emerald: 'text-emerald-500/20 dark:text-emerald-400/20',
  muted: 'text-muted-foreground/20',
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  to,
  variant = 'compact',
  tone = 'muted',
  className,
}: MetricCardProps) {
  if (variant === 'inline') {
    const content = (
      <>
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className={cn('size-3.5 shrink-0', TONE_ICON[tone])} />
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          </div>
          <div className="mt-1 font-display text-lg font-bold leading-tight">
            {value}
          </div>
          {hint && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
          )}
        </div>
        {to && (
          <ChevronRight className="relative z-10 mt-1 size-3.5 shrink-0 self-start text-muted-foreground/60" />
        )}
        <Icon
          aria-hidden
          className={cn(
            'pointer-events-none absolute -bottom-4 -right-3 size-20 -rotate-12',
            TONE_DECO[tone],
          )}
        />
      </>
    )
    const base = cn(
      'relative flex items-start gap-2 overflow-hidden rounded-2xl border p-3 shadow-sm backdrop-blur-sm',
      TONE_CARD[tone],
      className,
    )
    if (to) {
      return (
        <Link
          to={to}
          className={cn(
            base,
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
          )}
        >
          {content}
        </Link>
      )
    }
    return <div className={base}>{content}</div>
  }

  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
        {to && (
          <ChevronRight className="ml-auto size-3 text-muted-foreground/60" />
        )}
      </div>
      <div className="font-display text-2xl font-bold tabular-nums leading-none">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>
      )}
    </>
  )
  const base = cn(
    'block rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm',
    className,
  )
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          base,
          'transition-colors hover:border-border hover:bg-card active:scale-[0.99]',
        )}
      >
        {content}
      </Link>
    )
  }
  return <div className={base}>{content}</div>
}

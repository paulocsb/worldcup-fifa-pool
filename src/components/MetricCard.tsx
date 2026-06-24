import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetricTone = 'primary' | 'gold' | 'emerald' | 'muted'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
  /** When provided, the card becomes a Link */
  to?: string
  /**
   * `compact` (default) — vertical layout: small inline icon next to the label,
   * large value below. Used in /profile.
   * `inline` — horizontal layout: icon in a colored circle on the left,
   * label/value/hint stacked on the right. Used in /home grid.
   */
  variant?: 'compact' | 'inline'
  /** Color of the icon background circle. Only used in `inline` variant. */
  tone?: MetricTone
  className?: string
}

const TONE_WRAP: Record<MetricTone, string> = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-gold/10 text-gold',
  emerald:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  muted: 'bg-muted text-muted-foreground',
}

export function MetricCard({
  icon,
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
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            TONE_WRAP[tone],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="font-display text-lg font-bold leading-tight">
            {value}
          </div>
          {hint && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
          )}
        </div>
        {to && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
        )}
      </>
    )
    const base = cn(
      'flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm',
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

  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        {icon}
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

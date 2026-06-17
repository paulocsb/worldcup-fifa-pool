import { cn } from '@/lib/utils'

export type SectionHeaderTone =
  | 'default'
  | 'destructive'
  | 'primary'
  | 'gold'
  | 'muted'

interface SectionHeaderProps {
  title: string
  /** Tom do título + accent bar lateral */
  tone?: SectionHeaderTone
  /** Ícone opcional antes do título (renderizado na cor do tone) */
  icon?: React.ReactNode
  /** Conteúdo à direita (subtítulo, contagem, link) */
  trailing?: React.ReactNode
  /** Sticky no topo do container (útil para listas longas) */
  sticky?: boolean
  className?: string
}

const TONE_TEXT: Record<SectionHeaderTone, string> = {
  default: 'text-foreground',
  destructive: 'text-destructive',
  primary: 'text-primary',
  gold: 'text-gold',
  muted: 'text-muted-foreground',
}

const TONE_BAR: Record<SectionHeaderTone, string> = {
  default: 'bg-foreground',
  destructive: 'bg-destructive',
  primary: 'bg-primary',
  gold: 'bg-gold',
  muted: 'bg-muted-foreground',
}

/**
 * Cabeçalho de seção (subheader) usado em listas dentro de uma página.
 * Diferente do PageHeader (que é o título principal da página), este é usado
 * para agrupar conteúdo: "Hoje", "Ao vivo", "Próximos jogos", "Aparência" etc.
 *
 * Estilo: Saira Condensed Black uppercase com accent bar vertical à esquerda
 * para reforço visual (alusão ao ribbon do FIFA 2026).
 */
export function SectionHeader({
  title,
  tone = 'default',
  icon,
  trailing,
  sticky = false,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-2',
        sticky &&
          '-mx-4 sticky top-0 z-10 bg-background/85 px-4 py-1.5 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {/* Accent bar vertical */}
        <span
          aria-hidden
          className={cn('h-4 w-1 rounded-full', TONE_BAR[tone])}
        />
        {icon && <span className={TONE_TEXT[tone]}>{icon}</span>}
        <h2
          className={cn(
            'font-display text-base font-black uppercase leading-none tracking-wider md:text-lg',
            TONE_TEXT[tone],
          )}
        >
          {title}
        </h2>
      </div>
      {trailing && (
        <span className="text-[11px] font-medium text-muted-foreground">
          {trailing}
        </span>
      )}
    </header>
  )
}

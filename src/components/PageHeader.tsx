import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Se passado, renderiza um botão de voltar à esquerda do título */
  backTo?: string
  /** Conteúdo opcional à direita (badges, pills, etc) */
  trailing?: React.ReactNode
  /** Conteúdo opcional ABAIXO da linha do título (banner, hero, etc) */
  banner?: React.ReactNode
  /** Cor do accent bar inferior — padrão: primary */
  accent?: 'primary' | 'gold' | 'destructive' | string
  className?: string
}

/**
 * Cabeçalho padrão das páginas — segue o tom FIFA 2026:
 *  - Título em Saira Condensed Black, uppercase, tight tracking, large size
 *  - Subtítulo discreto em muted-foreground
 *  - Accent bar fina embaixo (cor primary por padrão; pode trocar)
 *  - Back button opcional alinhado verticalmente
 */
export function PageHeader({
  title,
  subtitle,
  backTo,
  trailing,
  banner,
  accent = 'primary',
  className,
}: PageHeaderProps) {
  const accentColor =
    accent === 'primary'
      ? 'bg-primary'
      : accent === 'gold'
        ? 'bg-gold'
        : accent === 'destructive'
          ? 'bg-destructive'
          : `[background-color:${accent}]`

  return (
    <header className={cn('relative space-y-2 pb-3', className)}>
      <div className="flex items-start gap-3">
        {backTo && (
          <Link
            to={backTo}
            aria-label="Voltar"
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {trailing && <div className="shrink-0 self-center">{trailing}</div>}
      </div>

      {banner}

      {/* Accent bar inferior — assinatura visual */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-0 left-0 h-1 w-12 rounded-full',
          accentColor,
        )}
      />
    </header>
  )
}

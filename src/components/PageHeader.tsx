import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /**
   * Se passado, renderiza um botão de voltar à esquerda do título.
   *
   * Comportamento: prioriza `navigate(-1)` (volta na pilha do browser pra
   * respeitar de onde o usuário veio). Cai pro destino do `backTo` apenas
   * quando não há histórico (deep-link direto).
   */
  backTo?: string
  /** Conteúdo opcional à direita (badges, pills, etc) */
  trailing?: React.ReactNode
  /** Conteúdo opcional ABAIXO da linha do título (banner, hero, etc) */
  banner?: React.ReactNode
  /**
   * Cor do accent bar inferior — padrão: `primary`.
   *
   * Valores nomeados (`primary` | `gold` | `destructive`) resolvem para
   * classes Tailwind reais. Qualquer outra string é tratada como uma cor
   * CSS arbitrária e aplicada via inline `style` (ex.: `'hsl(var(--group-e))'`),
   * já que classes Tailwind dinâmicas não sobrevivem ao purge.
   */
  accent?: 'primary' | 'gold' | 'destructive' | (string & {})
  className?: string
}

const NAMED_ACCENT_CLASS: Record<'primary' | 'gold' | 'destructive', string> = {
  primary: 'bg-primary',
  gold: 'bg-gold',
  destructive: 'bg-destructive',
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
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  function handleBack() {
    // `location.key === 'default'` quando é a primeira navegação da SPA
    // (deep-link direto, refresh, etc). Senão, há histórico — volta nele.
    if (location.key !== 'default') {
      navigate(-1)
    } else if (backTo) {
      navigate(backTo, { replace: true })
    }
  }

  const namedAccentClass =
    accent in NAMED_ACCENT_CLASS
      ? NAMED_ACCENT_CLASS[accent as keyof typeof NAMED_ACCENT_CLASS]
      : null
  // Strings arbitrárias (ex.: 'hsl(var(--group-e))') vão via inline style,
  // pois classes Tailwind dinâmicas não sobrevivem ao purge.
  const accentStyle = namedAccentClass
    ? undefined
    : ({ backgroundColor: accent } as React.CSSProperties)

  return (
    <header className={cn('space-y-3', className)}>
      <div className="flex items-start gap-3">
        {backTo && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('back')}
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {/* Accent bar — assinatura visual, alinhada à esquerda do título
              (dentro da coluna, então acompanha o recuo do back button). */}
          <span
            aria-hidden
            style={accentStyle}
            className={cn(
              'mt-2 block h-1 w-12 rounded-full',
              namedAccentClass,
            )}
          />
        </div>

        {trailing && <div className="shrink-0 self-center">{trailing}</div>}
      </div>

      {banner}
    </header>
  )
}

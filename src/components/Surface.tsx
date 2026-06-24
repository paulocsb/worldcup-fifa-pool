import { createElement, forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { accentVarStyle } from '@/lib/groupColors'
import { cn } from '@/lib/utils'

/**
 * <Surface> — caixa canônica do design system.
 *
 * Os tokens são derivados VERBATIM do MatchCard (src/components/MatchCard.tsx),
 * o padrão-ouro já aprovado em produção:
 *   - base: `rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm`
 *   - borda neutra: `border-border/60`
 *   - interactive: hover-lift + hover:shadow-md + active:scale
 *   - accent: `--accent-c` injetado como CANAIS HSL CRUS (via accentVarStyle),
 *     borda colorida `border-[hsl(var(--accent-c)_/_0.45)]` (+ /0.75 no hover).
 *
 * GOTCHA (não repetir): o Tailwind v3 descarta o modificador `/opacity` em
 * cores arbitrárias quando o var() já contém uma cor completa (`hsl(...)`).
 * Por isso o accent vem como canais crus e aplicamos `hsl(var(--accent-c)/x)`.
 *
 * Header band tonal: NÃO é responsabilidade do Surface raiz. O consumidor que
 * quiser uma faixa de header tingida aplica, num header interno, a MESMA
 * fórmula: `bg-[hsl(var(--accent-c)_/_0.12)]` (e texto
 * `[color:hsl(var(--accent-c))]`). O `--accent-c` injetado pelo Surface
 * cascateia para os filhos, então basta o consumidor usar a classe.
 */
const surfaceVariants = cva('', {
  variants: {
    variant: {
      // Caixa padrão: idêntica à superfície base do MatchCard.
      card: 'rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm',
      // Igual ao card; a borda colorida pelo accent é aplicada via compound.
      tonal:
        'rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm',
      // Sutil: empties, legendas — sem shadow/blur.
      subtle: 'rounded-2xl border border-border/60 bg-card/50',
      // Avisos: cor por `tone` (compound abaixo).
      notice: 'rounded-2xl border',
      // Placeholders TBA.
      dashed: 'rounded-2xl border border-dashed border-border bg-card/40',
    },
    // Bloco de feedback tátil — só quando interactive. Espelha o MatchCard.
    interactive: {
      true: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
      false: '',
    },
    tone: {
      warning:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      destructive: 'border-destructive/20 bg-destructive/5 text-destructive',
      info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
      success:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
    },
  },
  compoundVariants: [
    // tonal + accent → borda colorida em repouso (reforçada no hover quando
    // interactive). A presença do accent é sinalizada por `data-accent`.
    {
      variant: 'tonal',
      interactive: false,
      class:
        'data-[accent=true]:border-[hsl(var(--accent-c)_/_0.45)]',
    },
    {
      variant: 'tonal',
      interactive: true,
      class:
        'data-[accent=true]:border-[hsl(var(--accent-c)_/_0.45)] data-[accent=true]:hover:border-[hsl(var(--accent-c)_/_0.75)]',
    },
  ],
  defaultVariants: {
    variant: 'card',
    interactive: false,
    padding: 'md',
  },
})

type SurfaceElement = 'article' | 'div' | 'p' | 'section'

export interface SurfaceProps
  extends Omit<HTMLAttributes<HTMLElement>, 'color'>,
    Omit<VariantProps<typeof surfaceVariants>, 'interactive'> {
  /** hover-lift + active-scale + hover:shadow-md. Default false. */
  interactive?: boolean
  /**
   * Token de cor de identidade. Aceita tokens semânticos já resolvidos
   * ('group-a'..'group-l', 'phase-*', 'accent-gold'), nomes de var
   * ('primary', 'destructive') ou uma expressão `var(...)`/canais crus.
   * Resolvido internamente para `--accent-c` cru via accentVarStyle.
   * Relevante sobretudo no variant 'tonal' (borda colorida).
   */
  accent?: string
  /** Elemento raiz. Default 'div'. */
  as?: SurfaceElement
}

/**
 * Polimorfismo simples via `as` (sem radix Slot — não é dependência do projeto).
 * Para virar um <Link>, o consumidor envolve o Surface (ou um filho) com <Link>.
 */
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
  {
    as = 'div',
    variant,
    interactive = false,
    tone,
    padding,
    accent,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const accentStyle = accent ? accentVarStyle(accent) : undefined
  // createElement com `as` dinâmico: o ref é genérico (HTMLElement) e o tipo do
  // elemento JSX não cabe num único <Tag>. createElement evita o estreitamento
  // de ref para HTMLDivElement que o JSX impõe.
  return createElement(
    as,
    {
      ref,
      'data-accent': accent ? 'true' : undefined,
      style: accentStyle ? { ...accentStyle, ...style } : style,
      className: cn(
        surfaceVariants({ variant, interactive, tone, padding }),
        className,
      ),
      ...props,
    },
    children,
  )
})

import { cn } from '@/lib/utils'

interface FifaLogoProps {
  /** Altura em px. Largura mantém aspect ratio. Portrait ~0.65, horizontal ~2.65 */
  size?: number
  /** Orientação do mark. portrait = "26 empilhado", horizontal = "trofeu + 26 + FIFA WORLD CUP 2026" */
  variant?: 'portrait' | 'horizontal'
  className?: string
  alt?: string
}

/**
 * Marca oficial FIFA World Cup 2026. Renderiza 2 elementos lado a lado
 * (dark/light) e CSS mostra apenas o apropriado pro tema atual. Sem JS,
 * sem flash, sem wrapper que colapsa.
 */
export function FifaLogo({
  size = 64,
  variant = 'portrait',
  className,
  alt = '',
}: FifaLogoProps) {
  const dark = variant === 'portrait' ? '/fifa-logo.png' : '/fifa-logo-horizontal.png'
  const light = variant === 'portrait' ? '/fifa-logo-white.png' : '/fifa-logo-horizontal-white.png'
  const isHidden = alt === ''
  const style = { height: size, width: 'auto' as const }
  const baseClass = 'select-none align-middle'

  return (
    <>
      {/* Versão com numerais pretos — visível em tema CLARO */}
      <img
        src={dark}
        alt={isHidden ? '' : alt}
        aria-hidden={isHidden ? true : undefined}
        height={size}
        style={style}
        className={cn(baseClass, 'fifa-logo-light', className)}
        draggable={false}
      />
      {/* Versão com numerais brancos — visível em tema ESCURO */}
      <img
        src={light}
        alt=""
        aria-hidden
        height={size}
        style={style}
        className={cn(baseClass, 'fifa-logo-dark', className)}
        draggable={false}
      />
    </>
  )
}

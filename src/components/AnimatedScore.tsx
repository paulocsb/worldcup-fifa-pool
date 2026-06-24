import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedScoreProps {
  value: number | null | undefined
  className?: string
  /** Quando true, não anima na primeira montagem (evita "barulho" inicial). */
  skipInitial?: boolean
  /** Conteúdo a renderizar quando value é null/undefined */
  placeholder?: React.ReactNode
  /**
   * Quando true, mudanças reais de valor disparam um flash gold ("gol!") além
   * do flip. Pensado para o estado ao vivo. Nunca dispara no mount inicial.
   */
  flash?: boolean
}

/**
 * Score numérico que dispara animação `score-flip` sempre que muda.
 * Implementação simples: trocamos a `key` do span quando o valor muda,
 * forçando React a desmontar+remontar (animação CSS re-executa).
 *
 * Com `flash`, soma um glow gold one-shot (`score-flash`) à mudança — usado no
 * placar ao vivo para celebrar o gol. O flash só ocorre em mudança REAL após o
 * mount: `animKey` só incrementa fora da montagem inicial, então `animKey > 0`
 * garante que não há falso positivo no primeiro render.
 */
export function AnimatedScore({
  value,
  className,
  skipInitial = true,
  placeholder = '—',
  flash = false,
}: AnimatedScoreProps) {
  const prev = useRef<number | null | undefined>(value)
  const mounted = useRef(false)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (skipInitial) return
    }
    if (value !== prev.current) {
      prev.current = value
      setAnimKey((k) => k + 1)
    }
  }, [value, skipInitial])

  if (value == null) {
    return (
      <span className={cn('font-display tabular-nums', className)}>
        {placeholder}
      </span>
    )
  }

  return (
    <span
      key={animKey}
      className={cn(
        'animate-score-flip font-display inline-block tabular-nums',
        flash && animKey > 0 && 'animate-score-flash',
        className,
      )}
    >
      {value}
    </span>
  )
}

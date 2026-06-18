import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SubTabsProps<T extends string> {
  tabs: ReadonlyArray<{ slug: T; label: string }>
  active: T
  onChange: (slug: T) => void
  className?: string
}

/**
 * Pílulas de navegação horizontal. Scroll horizontal com snap, e a pílula
 * ativa é centralizada automaticamente quando muda (incluindo o mount inicial).
 *
 * Usada na /standings pra alternar entre Fase de Grupos, 32-avos, Oitavas, etc.
 */
export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: SubTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const btn = activeBtnRef.current
    const container = containerRef.current
    if (!btn || !container) return
    const target =
      btn.offsetLeft - (container.clientWidth - btn.clientWidth) / 2
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [active])

  return (
    <nav
      ref={containerRef}
      role="tablist"
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 scrollbar-none',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === active
        return (
          <button
            key={tab.slug}
            ref={isActive ? activeBtnRef : null}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.slug)}
            className={cn(
              'shrink-0 snap-center whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

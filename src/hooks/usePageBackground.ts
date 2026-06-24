import { useEffect } from 'react'

/**
 * Tema de fundo contextual da página inteira.
 * Aplica uma classe no <body> durante o mount; remove no unmount.
 *
 * Classes correspondentes devem existir em src/index.css ou serem aplicadas
 * via inline (este hook usa atributo data-page-theme que o CSS estiliza).
 *
 * Exemplo: usePageBackground('group-stage') na /predictions/groups.
 */
export type PageTheme =
  | 'default'
  | 'group-stage'
  | 'knockouts'
  | 'final'
  | 'ranking'
  | 'group'

interface PageBackgroundOptions {
  /**
   * Token de cor (sem `--`, ex.: 'group-e') cujos canais HSL crus alimentam
   * `--page-accent`. Usado apenas quando `theme === 'group'` para tematizar o
   * fundo na cor do grupo sem precisar de 12 blocos CSS.
   */
  accent?: string | null
}

export function usePageBackground(
  theme: PageTheme,
  opts?: PageBackgroundOptions,
) {
  const accent = opts?.accent ?? null
  useEffect(() => {
    const prev = document.body.dataset.pageTheme
    document.body.dataset.pageTheme = theme
    const useAccent = theme === 'group' && !!accent
    if (useAccent) {
      document.body.style.setProperty('--page-accent', `var(--${accent})`)
    }
    return () => {
      if (prev) document.body.dataset.pageTheme = prev
      else delete document.body.dataset.pageTheme
      if (useAccent) document.body.style.removeProperty('--page-accent')
    }
  }, [theme, accent])
}

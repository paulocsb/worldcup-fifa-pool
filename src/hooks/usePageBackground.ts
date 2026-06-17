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

export function usePageBackground(theme: PageTheme) {
  useEffect(() => {
    const prev = document.body.dataset.pageTheme
    document.body.dataset.pageTheme = theme
    return () => {
      if (prev) document.body.dataset.pageTheme = prev
      else delete document.body.dataset.pageTheme
    }
  }, [theme])
}

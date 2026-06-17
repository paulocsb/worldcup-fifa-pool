import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
const KEY = 'fifa-bolao:theme'

function readStored(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const v = window.localStorage.getItem(KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  // Sem preferência salva: default = dark (brand FIFA fica mais expressivo
  // em fundo escuro com a paleta navy-pitch + gold + verde-gramado).
  return 'dark'
}

function apply(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    apply(theme)
    window.localStorage.setItem(KEY, theme)
  }, [theme])

  return [theme, setThemeState]
}

import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { markAsReturningUser } from '@/lib/inviteStorage'

type State =
  | { kind: 'waiting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

/**
 * O cliente Supabase com `detectSessionInUrl: true` (default) já faz o
 * exchange do `?code=` automaticamente. Aqui só esperamos a sessão aparecer
 * via onAuthStateChange e redirecionamos.
 */
export function AuthCallback() {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>({ kind: 'waiting' })
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')

  useEffect(() => {
    // Erro vindo na URL (link expirado, código inválido, etc.)
    const urlError =
      params.get('error_description') ?? params.get('error') ?? null
    if (urlError) {
      setState({ kind: 'error', message: urlError })
      return
    }

    // Pode já ter sido exchanged antes desse mount (caching) — checa agora
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        markAsReturningUser()
        setState({ kind: 'success' })
      }
    })

    // E também escuta novos sign-ins (detectSessionInUrl é assíncrono)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        markAsReturningUser()
        setState({ kind: 'success' })
      }
    })

    // Fallback: se em 8s não tiver sessão, mostra erro com link pra retry
    const timeoutId = setTimeout(() => {
      setState((s) =>
        s.kind === 'waiting'
          ? {
              kind: 'error',
              message: t('linkExpired'),
            }
          : s,
      )
    }, 8000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [params])

  if (state.kind === 'waiting') {
    return (
      <main className="container flex min-h-svh flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('signingIn')}</p>
      </main>
    )
  }

  if (state.kind === 'success') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="container flex min-h-svh flex-col items-center justify-center gap-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-black uppercase leading-tight tracking-tight">
          {t('signInFailed')}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {state.message}
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
      >
        {tCommon('retry')}
      </Link>
    </main>
  )
}

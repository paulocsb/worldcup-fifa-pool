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

    // E também escuta novos sign-ins (detectSessionInUrl é assíncrono).
    // Aceita QUALQUER evento que traga sessão — o implicit flow às vezes emite
    // INITIAL_SESSION em vez de SIGNED_IN ao processar o hash da URL.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        markAsReturningUser()
        setState({ kind: 'success' })
      }
    })

    // Fallback: cold start em celular (SW instalando + parse + round-trip ao
    // Supabase) pode passar de alguns segundos, então damos uma janela generosa.
    // Antes de declarar erro, faz uma última checagem de sessão — cobre o caso
    // da sessão chegar logo após o corte do timeout.
    const timeoutId = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        markAsReturningUser()
        setState({ kind: 'success' })
        return
      }
      setState((s) =>
        s.kind === 'waiting'
          ? {
              kind: 'error',
              message: t('linkExpired'),
            }
          : s,
      )
    }, 20000)

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

import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { FifaLogo } from '@/components/FifaLogo'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  isReturningUser,
  readStoredInvite,
  storeInvite,
} from '@/lib/inviteStorage'

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string }

type InviteState =
  | { kind: 'checking' }
  | { kind: 'missing' }      // sem ?invite= na URL
  | { kind: 'invalid'; code: string }
  | { kind: 'valid'; code: string }

export function LoginPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [invite, setInvite] = useState<InviteState>({ kind: 'checking' })
  const { t } = useTranslation('auth')
  const emailSchema = z.string().email(t('invalidEmail'))

  const urlInvite = params.get('invite')?.trim() ?? ''

  useEffect(() => {
    let cancelled = false
    async function check() {
      // Prioridade: URL > localStorage. URL invite SOBRESCREVE storage.
      const stored = readStoredInvite() ?? ''
      const candidate = urlInvite || stored
      const returning = isReturningUser()

      // Sem invite nenhum: returning user passa (profile já existe),
      // novo usuário sem invite é bloqueado.
      if (!candidate) {
        if (!cancelled) {
          setInvite(returning ? { kind: 'valid', code: '' } : { kind: 'missing' })
        }
        return
      }

      // Validar via RPC
      const { data, error } = await supabase.rpc('validate_invite', {
        p_code: candidate,
      })
      if (cancelled) return

      if (error || !data) {
        // Invite inválido — returning user ainda passa (não precisa)
        if (returning) {
          setInvite({ kind: 'valid', code: '' })
        } else {
          setInvite({ kind: 'invalid', code: candidate })
        }
        return
      }

      // Válido: persiste pra próximas aberturas do PWA sem URL param
      storeInvite(candidate)
      setInvite({ kind: 'valid', code: candidate })
    }
    check()
    return () => {
      cancelled = true
    }
  }, [urlInvite])

  if (auth.status === 'authenticated') return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (invite.kind !== 'valid') return

    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) {
      setState({ kind: 'error', message: parsed.error.issues[0].message })
      return
    }
    setState({ kind: 'sending' })
    // Preserva o invite no URL de redirect e no user_metadata
    const callback = `${window.location.origin}/auth/callback?invite=${encodeURIComponent(invite.code)}`
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        emailRedirectTo: callback,
        data: { invite_code: invite.code },
      },
    })
    if (error) {
      setState({ kind: 'error', message: error.message })
      return
    }
    setState({ kind: 'sent', email: parsed.data })
  }

  return (
    <main className="bg-fwc-dots container relative flex min-h-svh flex-col items-center justify-center gap-8 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <FifaLogo size={140} alt="FIFA World Cup 2026" />
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            {t('title')}
          </h1>
          {invite.kind === 'valid' && (
            <p className="max-w-sm text-balance text-muted-foreground">
              {t('subtitle')}
            </p>
          )}
        </div>
      </div>

      {invite.kind === 'checking' && (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      )}

      {(invite.kind === 'missing' || invite.kind === 'invalid') && (
        <PrivateBolaoMessage variant={invite.kind} code={urlInvite} />
      )}

      {invite.kind === 'valid' && (
        <>
          {state.kind === 'sent' ? (
            <div className="glass w-full max-w-sm space-y-3 rounded-2xl p-6 text-center shadow-sm animate-float-in">
              <Mail className="mx-auto size-8 text-primary" />
              <h2 className="font-semibold">{t('linkSent')}</h2>
              <p
                className="text-sm text-muted-foreground"
                /* dangerouslySetInnerHTML to preserve <strong> from translation */
                dangerouslySetInnerHTML={{
                  __html: t('openLinkAt', { email: state.email }),
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState({ kind: 'idle' })}
              >
                {t('useOtherEmail')}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-sm space-y-3"
              noValidate
            >
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state.kind === 'sending'}
                aria-label="Email"
                required
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={state.kind === 'sending'}
              >
                {state.kind === 'sending' ? (
                  <>
                    <Loader2 className="animate-spin" /> {t('sending')}
                  </>
                ) : (
                  t('sendMagicLink')
                )}
              </Button>
              {state.kind === 'error' && (
                <p
                  className="text-center text-sm text-destructive"
                  role="alert"
                >
                  {state.message}
                </p>
              )}
            </form>
          )}
        </>
      )}
    </main>
  )
}

function PrivateBolaoMessage({
  variant,
  code,
}: {
  variant: 'missing' | 'invalid'
  code: string
}) {
  const { t } = useTranslation('auth')
  return (
    <div className="glass w-full max-w-sm space-y-4 rounded-2xl p-6 text-center shadow-sm animate-float-in">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-black uppercase tracking-tight">
          {t('privateLobbyTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {variant === 'missing'
            ? t('privateLobbyMissing')
            : t('privateLobbyInvalid', { code })}
        </p>
      </div>
    </div>
  )
}

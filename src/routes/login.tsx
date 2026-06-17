import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FifaLogo } from '@/components/FifaLogo'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const emailSchema = z.string().email('Digite um email válido')

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

  const inviteCode = params.get('invite')?.trim() ?? ''

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!inviteCode) {
        if (!cancelled) setInvite({ kind: 'missing' })
        return
      }
      const { data, error } = await supabase.rpc('validate_invite', {
        p_code: inviteCode,
      })
      if (cancelled) return
      if (error || !data) {
        setInvite({ kind: 'invalid', code: inviteCode })
      } else {
        setInvite({ kind: 'valid', code: inviteCode })
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [inviteCode])

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
            Bolão
          </h1>
          {invite.kind === 'valid' && (
            <p className="max-w-sm text-balance text-muted-foreground">
              Entre com seu email — enviamos um link mágico, sem senha.
            </p>
          )}
        </div>
      </div>

      {invite.kind === 'checking' && (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      )}

      {(invite.kind === 'missing' || invite.kind === 'invalid') && (
        <PrivateBolaoMessage variant={invite.kind} code={inviteCode} />
      )}

      {invite.kind === 'valid' && (
        <>
          {state.kind === 'sent' ? (
            <div className="glass w-full max-w-sm space-y-3 rounded-2xl p-6 text-center shadow-sm animate-float-in">
              <Mail className="mx-auto size-8 text-primary" />
              <h2 className="font-semibold">Link enviado</h2>
              <p className="text-sm text-muted-foreground">
                Abra o link em <strong>{state.email}</strong> para entrar.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState({ kind: 'idle' })}
              >
                Usar outro email
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
                placeholder="seu@email.com"
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
                    <Loader2 className="animate-spin" /> Enviando…
                  </>
                ) : (
                  'Enviar link mágico'
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
  return (
    <div className="glass w-full max-w-sm space-y-4 rounded-2xl p-6 text-center shadow-sm animate-float-in">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-black uppercase tracking-tight">
          Bolão privado
        </h2>
        <p className="text-sm text-muted-foreground">
          {variant === 'missing'
            ? 'O acesso é somente por link de convite. Peça o link ao admin do bolão.'
            : `O convite "${code}" não é válido ou já foi esgotado. Peça um novo ao admin.`}
        </p>
      </div>
    </div>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Loader2, RotateCw } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { FifaLogo } from '@/components/FifaLogo'
import { Input } from '@/components/ui/input'
import { AVATAR_STYLE, randomSeed } from '@/lib/dicebear'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(40, 'Máximo 40 caracteres'),
  avatar_seed: z.string().min(1),
})

function makeSeedOptions(n: number) {
  return Array.from({ length: n }, () => randomSeed())
}

export function OnboardingPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [displayName, setDisplayName] = useState(
    auth.session?.user.email?.split('@')[0] ?? '',
  )
  const [seedPool, setSeedPool] = useState(() => makeSeedOptions(6))
  const [selectedSeed, setSelectedSeed] = useState(seedPool[0])
  const [error, setError] = useState<string | null>(null)

  const userId = auth.session?.user.id

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Sem sessão')
      const parsed = profileSchema.safeParse({
        display_name: displayName.trim(),
        avatar_seed: selectedSeed,
      })
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message)
      }
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        display_name: parsed.data.display_name,
        avatar_seed: parsed.data.avatar_seed,
        avatar_style: AVATAR_STYLE,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      navigate('/', { replace: true })
    },
    onError: (err: Error) => setError(err.message),
  })

  const preview = useMemo(() => selectedSeed, [selectedSeed])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <section className="container space-y-8 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <FifaLogo size={80} alt="FIFA World Cup 2026" />
        <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
          Bem-vindo ao bolão
        </h1>
        <p className="text-balance text-muted-foreground">
          Escolha como vai aparecer no ranking.
        </p>
      </header>

      <div className="mx-auto flex justify-center">
        <Avatar seed={preview} size={120} className="size-28" />
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-5">
        <div className="space-y-2">
          <label htmlFor="display_name" className="text-sm font-medium">
            Como devemos te chamar?
          </label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu apelido"
            maxLength={40}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Escolha um avatar</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const next = makeSeedOptions(6)
                setSeedPool(next)
                setSelectedSeed(next[0])
              }}
            >
              <RotateCw className="size-3" />
              Mais opções
            </button>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            {seedPool.map((seed) => {
              const selected = seed === selectedSeed
              return (
                <li key={seed}>
                  <button
                    type="button"
                    onClick={() => setSelectedSeed(seed)}
                    className={
                      'flex w-full items-center justify-center rounded-xl border-2 p-2 transition-colors ' +
                      (selected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-border')
                    }
                    aria-pressed={selected}
                  >
                    <Avatar seed={seed} size={72} className="size-16" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin" /> Salvando…
            </>
          ) : (
            'Entrar no bolão'
          )}
        </Button>
      </form>
    </section>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeamSelect } from '@/components/TeamSelect'
import { GroupPill } from '@/components/GroupPill'
import { groupColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  ALL_GROUPS,
  useGroupLocks,
  useMyGroupPredictions,
  useUpsertGroupPrediction,
  type GroupLetter,
} from '@/hooks/useGroupPredictions'
import { useTeams } from '@/hooks/useTeams'

const POSITION_LABELS = ['1º (1º colocado)', '2º (vai aos 32-avos)', '3º (vai se for top 8)', '4º (eliminado)']
const POSITION_POINTS = [5, 5, 3, 2]

export function GroupDetailPage() {
  const params = useParams<{ letter: string }>()
  const letterParam = (params.letter ?? '').toUpperCase()
  const letter = ALL_GROUPS.includes(letterParam as GroupLetter)
    ? (letterParam as GroupLetter)
    : null

  const auth = useAuth()
  const userId = auth.session?.user.id
  const teams = useTeams()
  const predictions = useMyGroupPredictions(userId)
  const locks = useGroupLocks()
  const mutation = useUpsertGroupPrediction(userId)

  const [first, setFirst] = useState<number | null>(null)
  const [second, setSecond] = useState<number | null>(null)
  const [third, setThird] = useState<number | null>(null)
  const [fourth, setFourth] = useState<number | null>(null)

  const current = useMemo(
    () => predictions.data?.find((p) => p.group_letter === letter) ?? null,
    [predictions.data, letter],
  )

  useEffect(() => {
    if (current) {
      setFirst(current.first_team_id)
      setSecond(current.second_team_id)
      setThird(current.third_team_id)
      setFourth(current.fourth_team_id)
    }
  }, [current])

  if (!letter) return <Navigate to="/predictions/groups" replace />

  const token = groupColorToken(letter)
  const accentStyle = token
    ? ({ '--accent-c': `hsl(var(--${token}))` } as React.CSSProperties)
    : undefined

  const groupTeams = teams.data?.filter((t) => t.group_letter === letter) ?? []
  const isOpen = locks.data?.[letter] ?? false
  const positions: Array<[number | null, (id: number) => void]> = [
    [first, setFirst],
    [second, setSecond],
    [third, setThird],
    [fourth, setFourth],
  ]
  const allFilled = positions.every(([v]) => v !== null)
  const allDistinct = new Set(positions.map(([v]) => v)).size === 4

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allFilled || !allDistinct || !letter) return
    await mutation.mutateAsync({
      group_letter: letter,
      first_team_id: first!,
      second_team_id: second!,
      third_team_id: third!,
      fourth_team_id: fourth!,
    })
  }

  const loading = teams.isPending || predictions.isPending || locks.isPending

  return (
    <section style={accentStyle} className="container space-y-5 py-4">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-[color:var(--accent-c)]/10 p-4">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 [background-color:var(--accent-c)]"
        />
        <div className="flex items-center gap-3">
          <Link
            to="/predictions/groups"
            aria-label="Voltar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
                Grupo {letter}
              </h1>
              <GroupPill letter={letter} size="sm" withLabel={false} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordem final dos 4 times
            </p>
          </div>
        </div>
      </header>

      {!isOpen && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="size-4 shrink-0" />
          <span>Palpite encerrado para este grupo.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {positions.map(([value, setValue], idx) => {
            const others = positions
              .filter((_, i) => i !== idx)
              .map(([v]) => v)
              .filter(Boolean) as number[]
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold">
                    {POSITION_LABELS[idx]}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {POSITION_POINTS[idx]} pts se acertar
                  </span>
                </div>
                <TeamSelect
                  teams={groupTeams}
                  value={value}
                  onChange={setValue}
                  excludeIds={others}
                  placeholder={`Escolher ${idx + 1}º`}
                  disabled={!isOpen}
                />
              </div>
            )
          })}

          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {(mutation.error as Error).message}
            </p>
          )}
          {mutation.isSuccess && !mutation.isPending && (
            <p
              className="flex items-center gap-2 text-sm text-primary"
              role="status"
            >
              <CheckCircle2 className="size-4" />
              Palpite salvo!
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className={cn(
              'w-full transition-all duration-300',
              isOpen &&
                allFilled &&
                allDistinct &&
                !mutation.isPending &&
                'glow-primary',
            )}
            disabled={
              !isOpen || !allFilled || !allDistinct || mutation.isPending
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" /> Salvando…
              </>
            ) : current ? (
              'Atualizar palpite'
            ) : (
              'Salvar palpite'
            )}
          </Button>
        </form>
      )}
    </section>
  )
}

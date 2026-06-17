import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PositionBadge } from '@/components/PositionBadge'
import { TeamSelect } from '@/components/TeamSelect'
import { usePageBackground } from '@/hooks/usePageBackground'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTeams, useTournamentLockOpen } from '@/hooks/useTeams'
import {
  useTournamentPrediction,
  useUpsertTournamentPrediction,
} from '@/hooks/useTournamentPrediction'
import type { Team } from '@/types/db'

export function TournamentPredictionPage() {
  const auth = useAuth()
  const userId = auth.session?.user.id
  const teams = useTeams()
  const lock = useTournamentLockOpen()
  const current = useTournamentPrediction(userId)
  const mutation = useUpsertTournamentPrediction(userId)
  usePageBackground('final')

  const [champion, setChampion] = useState<number | null>(null)
  const [runnerUp, setRunnerUp] = useState<number | null>(null)
  const [third, setThird] = useState<number | null>(null)

  useEffect(() => {
    if (current.data) {
      setChampion(current.data.champion_team_id)
      setRunnerUp(current.data.runner_up_team_id)
      setThird(current.data.third_place_team_id)
    }
  }, [current.data])

  const isOpen = lock.data?.open ?? false
  const allFilled = champion && runnerUp && third
  const distinct =
    champion !== runnerUp && champion !== third && runnerUp !== third

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allFilled || !distinct) return
    await mutation.mutateAsync({
      champion_team_id: champion!,
      runner_up_team_id: runnerUp!,
      third_place_team_id: third!,
    })
  }

  const loading = teams.isPending || lock.isPending || current.isPending

  return (
    <section className="container space-y-6 py-4">
      <PageHeader
        title="Palpite do torneio"
        subtitle="Quem fica em 1º, 2º e 3º lugar"
        backTo="/"
        accent="gold"
        trailing={
          <Link
            to="/regras"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-3" />
            Regras
          </Link>
        }
      />

      {!isOpen && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="size-4 shrink-0" />
          <span>
            Palpite encerrado — a fase de grupos terminou.
          </span>
        </div>
      )}

      {isOpen && lock.data && (
        <p className="text-xs text-muted-foreground">
          Você pode editar até o fim da fase de grupos (
          {lock.data.remaining_group_matches} jogos restantes).
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Slot
            icon={
              <PositionBadge position="gold" variant="icon-only" size="lg" />
            }
            label="Campeão"
            sublabel="30 pts se acertar"
            teams={teams.data ?? []}
            value={champion}
            onChange={setChampion}
            excludeIds={[runnerUp, third].filter(Boolean) as number[]}
            disabled={!isOpen}
          />
          <Slot
            icon={
              <PositionBadge position="silver" variant="icon-only" size="lg" />
            }
            label="Vice-campeão"
            sublabel="15 pts se acertar"
            teams={teams.data ?? []}
            value={runnerUp}
            onChange={setRunnerUp}
            excludeIds={[champion, third].filter(Boolean) as number[]}
            disabled={!isOpen}
          />
          <Slot
            icon={
              <PositionBadge position="bronze" variant="icon-only" size="lg" />
            }
            label="Terceiro lugar"
            sublabel="10 pts se acertar"
            teams={teams.data ?? []}
            value={third}
            onChange={setThird}
            excludeIds={[champion, runnerUp].filter(Boolean) as number[]}
            disabled={!isOpen}
          />

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
              isOpen && allFilled && distinct && !mutation.isPending && 'glow-gold',
            )}
            disabled={!isOpen || !allFilled || !distinct || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" /> Salvando…
              </>
            ) : current.data ? (
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

interface SlotProps {
  icon: React.ReactNode
  label: string
  sublabel: string
  teams: Team[]
  value: number | null
  onChange: (id: number) => void
  excludeIds: number[]
  disabled?: boolean
}

function Slot({
  icon,
  label,
  sublabel,
  teams,
  value,
  onChange,
  excludeIds,
  disabled,
}: SlotProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
      </div>
      <TeamSelect
        teams={teams}
        value={value}
        onChange={onChange}
        excludeIds={excludeIds}
        placeholder={`Escolher ${label.toLowerCase()}`}
        disabled={disabled}
      />
    </div>
  )
}

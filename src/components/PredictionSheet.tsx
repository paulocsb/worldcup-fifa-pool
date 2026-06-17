import { useEffect, useState } from 'react'
import { Loader2, Minus, Plus, X } from 'lucide-react'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction } from '@/types/db'
import { useUpsertPrediction } from '@/hooks/usePredictions'
import { isPredictionOpen } from '@/lib/matchLock'
import { kickoffLabel } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { TeamBadge } from './TeamBadge'
import { cn } from '@/lib/utils'

interface PredictionSheetProps {
  match: MatchWithTeams | null
  existing?: Prediction
  userId: string | undefined
  onClose: () => void
}

function ScoreStepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid size-12 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="size-5" />
        </button>
        <div className="grid w-14 place-items-center text-4xl font-bold tabular-nums">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="grid size-12 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  )
}

export function PredictionSheet({
  match,
  existing,
  userId,
  onClose,
}: PredictionSheetProps) {
  const [home, setHome] = useState(existing?.home_score ?? 0)
  const [away, setAway] = useState(existing?.away_score ?? 0)
  const mutation = useUpsertPrediction(userId)

  useEffect(() => {
    setHome(existing?.home_score ?? 0)
    setAway(existing?.away_score ?? 0)
    mutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, existing?.id])

  if (!match) return null

  const open = isPredictionOpen(match)

  async function handleSave() {
    if (!match || !open) return
    await mutation.mutateAsync({
      match_id: match.id,
      home_score: home,
      away_score: away,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palpite"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={cn(
          'glass-strong safe-bottom w-full max-w-md rounded-t-3xl p-5 shadow-2xl',
          'animate-in slide-in-from-bottom-8 duration-300 ease-out',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30"
        />
        <header className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Seu palpite</h2>
            <p className="text-xs text-muted-foreground">
              {kickoffLabel(match.kickoff_at)}
              {match.group_letter ? ` · Grupo ${match.group_letter}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={match.home_team} className="flex-col gap-1 text-center" />
            <ScoreStepper value={home} onChange={setHome} label="Casa" />
          </div>
          <div className="px-1 text-xl font-semibold text-muted-foreground">
            ×
          </div>
          <div className="flex flex-col items-center gap-2">
            <TeamBadge team={match.away_team} className="flex-col gap-1 text-center" />
            <ScoreStepper value={away} onChange={setAway} label="Visitante" />
          </div>
        </div>

        {mutation.isError && (
          <p
            className="mt-4 text-center text-sm text-destructive"
            role="alert"
          >
            {(mutation.error as Error).message}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          onClick={handleSave}
          disabled={!open || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin" /> Salvando…
            </>
          ) : (
            'Salvar palpite'
          )}
        </Button>
      </div>
    </div>
  )
}

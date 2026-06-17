import { useMemo, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import type { Team } from '@/types/db'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { TeamBadge } from './TeamBadge'
import { TeamFlag } from './TeamFlag'

/**
 * Label do time já selecionado no trigger do TeamSelect.
 * Mostra flag + sigla em font-display + nome em subtítulo. Estilo "FIFA".
 */
function SelectedTeamLabel({ team }: { team: Team }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamFlag team={team} size={28} />
      <span className="font-display text-lg font-black uppercase leading-none tracking-tight">
        {team.code}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {team.name}
      </span>
    </div>
  )
}

interface TeamSelectProps {
  teams: Team[]
  /** ids que NÃO podem ser escolhidos (já escolhidos em outros campos) */
  excludeIds?: number[]
  value: number | null
  onChange: (id: number) => void
  placeholder?: string
  disabled?: boolean
}

export function TeamSelect({
  teams,
  excludeIds = [],
  value,
  onChange,
  placeholder = 'Escolher seleção',
  disabled,
}: TeamSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => teams.find((t) => t.id === value) ?? null,
    [teams, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter((t) => {
      if (excludeIds.includes(t.id) && t.id !== value) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        `grupo ${t.group_letter.toLowerCase()}`.includes(q)
      )
    })
  }, [teams, excludeIds, value, query])

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {selected ? (
          <SelectedTeamLabel team={selected} />
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong safe-bottom flex max-h-[80vh] w-full max-w-md flex-col gap-3 rounded-t-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30"
            />
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{placeholder}</h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </header>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, sigla ou grupo…"
              autoFocus
            />
            <ul className="-mx-2 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Nada encontrado.
                </li>
              ) : (
                filtered.map((t) => {
                  const isSelected = t.id === value
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(t.id)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent',
                          isSelected && 'bg-primary/10',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <TeamBadge team={t} size="sm" />
                          <span className="text-xs uppercase text-muted-foreground">
                            Grupo {t.group_letter}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

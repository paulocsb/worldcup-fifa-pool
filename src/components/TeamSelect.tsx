import { useMemo, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  value: number | null
  onChange: (id: number) => void
  /**
   * Returns a short label (e.g., "2º", "Campeão") when the team is already
   * assigned to another slot in the same screen. The team stays selectable —
   * selecting it triggers a swap on the parent (via onChange). Receivers
   * decide swap semantics.
   */
  assignedAtLabel?: (teamId: number) => string | null
  placeholder?: string
  disabled?: boolean
}

export function TeamSelect({
  teams,
  value,
  onChange,
  assignedAtLabel,
  placeholder,
  disabled,
}: TeamSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const resolvedPlaceholder = placeholder ?? t('chooseTeam')

  const selected = useMemo(
    () => teams.find((t) => t.id === value) ?? null,
    [teams, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter((t) => {
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        `grupo ${t.group_letter.toLowerCase()}`.includes(q)
      )
    })
  }, [teams, query])

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
          <span className="text-muted-foreground">{resolvedPlaceholder}</span>
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
              <h3 className="font-semibold">{resolvedPlaceholder}</h3>
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
              placeholder={t('teamSearchPlaceholder')}
              autoFocus
            />
            <ul className="-mx-2 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {t('noResults')}
                </li>
              ) : (
                filtered.map((team) => {
                  const isSelected = team.id === value
                  const otherSlotLabel =
                    !isSelected && assignedAtLabel
                      ? assignedAtLabel(team.id)
                      : null
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(team.id)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent',
                          isSelected && 'bg-primary/10',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <TeamBadge team={team} size="sm" />
                          <span className="text-xs uppercase text-muted-foreground">
                            {t('group')} {team.group_letter}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {otherSlotLabel && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {t('atSlot', { slot: otherSlotLabel })}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="size-4 shrink-0 text-primary" />
                          )}
                        </div>
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

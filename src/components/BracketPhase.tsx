import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MatchStage, Prediction, Team } from '@/types/db'
import { MatchCard } from './MatchCard'
import { MatchCardSkeleton } from './MatchCardSkeleton'
import { PredictionSheet } from './PredictionSheet'
import { PhasePill } from './PhasePill'
import { SectionHeader } from './SectionHeader'
import { Surface } from './Surface'
import { TeamFlag } from './TeamFlag'
import { useAuth } from '@/hooks/useAuth'
import { type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useBracketNodes, type BracketNodeItem } from '@/hooks/useBracketNodes'
import {
  formatSlotLabel,
  hasBracketStructure,
  type BracketSlot,
} from '@/lib/bracketStructure'
import { sectionDateLabel, timeOfDay } from '@/lib/format'
import { venueLabel } from '@/lib/venueCountry'
import { PHASE_LABEL_PT, phaseColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import type { TabSlug } from '@/lib/tournamentPhase'
import { emptyStateForTab } from '@/lib/tournamentPhase'

interface BracketPhaseProps {
  /** Stages incluídos nesta tab (ex: ['third_place', 'final']) */
  stages: ReadonlyArray<MatchStage>
  /** Slug usado pra empty state message */
  slug: TabSlug
}

/**
 * Renderiza uma fase de mata-mata como UMA lista de confrontos oficiais, em
 * ordem de chave (número de jogo). Cada confronto aparece UMA única vez:
 *
 * 1. Resolve os slots (1º/2º de grupos COMPLETOS) a times reais.
 * 2. Casa o confronto a um jogo do banco por IDENTIDADE DE TIME (par de ids ==
 *    {home.id, away.id}, ambos resolvidos) — não por contagem. Isso elimina a
 *    duplicação antiga (mesmo confronto como MatchCard + SlotCard).
 * 3. Com jogo casado → MatchCard real (estados/horário/placar/Palpitar).
 *    Sem jogo casado → BracketMatchCard (preview espelhando o MatchCard).
 *
 * Limitação: confrontos cujo slot não é resolvível agora (best3rd / winnerOf /
 * loserOf) nunca casam um jogo do banco (não sabemos o par de times) e sempre
 * renderizam o BracketMatchCard com labels. No estado atual (pós-grupos) o caso
 * relevante são os group-slots (ex 73: 2ºA × 2ºB), que casam corretamente.
 */
export function BracketPhase({ stages, slug }: BracketPhaseProps) {
  const { t } = useTranslation('matches')
  const auth = useAuth()
  const nodes = useBracketNodes()
  const predictions = useMyPredictions(auth.session?.user.id)
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  /**
   * Reagrupa os nós (já resolvidos + casados pelo hook) por stage, na ORDEM da
   * prop `stages`, e dentro de cada stage na ordem oficial (ref). Comportamento
   * idêntico ao memo inline anterior — a lógica de resolução/casamento migrou
   * para useBracketNodes/buildBracketNodes sem mudança.
   */
  const sections = useMemo(() => {
    return stages
      .filter(hasBracketStructure)
      .map((stage) => ({ stage, items: nodes.forStages([stage]) }))
      .filter((s) => s.items.length > 0)
  }, [stages, nodes])

  if (nodes.isPending) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <MatchCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (nodes.isError) {
    return (
      <Surface
        variant="notice"
        tone="destructive"
        as="p"
        className="text-sm"
        role="alert"
        aria-live="polite"
      >
        Erro ao carregar jogos: {nodes.error?.message}
      </Surface>
    )
  }

  if (sections.length === 0) {
    return (
      <Surface
        variant="dashed"
        padding="none"
        className="animate-float-in flex flex-col items-center gap-3 p-8 text-center"
      >
        <Loader2 className="size-6 text-muted-foreground/60" />
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          {emptyStateForTab(slug)}
        </p>
      </Surface>
    )
  }

  // Mostra o cabeçalho de fase só quando a tab agrega múltiplos stages
  // (ex: 3º lugar + Final). Numa única fase o título da tab já basta.
  const showStageHeaders = sections.length > 1

  return (
    <>
      <div className="space-y-6">
        {sections.map(({ stage, items }) => (
          <section key={stage} className="space-y-3">
            {showStageHeaders && (
              <SectionHeader
                title={PHASE_LABEL_PT[stage]}
                trailing={t('matchesCount', { count: items.length })}
                sticky
              />
            )}
            <ul className="space-y-3">
              {items.map((item) =>
                item.dbMatch ? (
                  <li key={`db-${item.dbMatch.id}`}>
                    <MatchCard
                      match={item.dbMatch}
                      prediction={predictionByMatch.get(item.dbMatch.id)}
                      onPredict={setActive}
                      matchNumber={item.bracket.ref}
                    />
                  </li>
                ) : (
                  <li key={`bracket-${item.bracket.ref}`}>
                    <BracketMatchCard item={item} />
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
      </div>

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={auth.session?.user.id}
        onClose={() => setActive(null)}
      />
    </>
  )
}

/**
 * Card de confronto PREVISTO — espelha o corpo agendado do MatchCard
 * (src/components/MatchCard.tsx), trocando time por label de slot quando não
 * resolvido e horário por "TBD" quando não há jogo agendado.
 *
 * Header: "Jogo N" à ESQUERDA (com sub-linha "data · local" quando há jogo do
 * banco associado por ≥1 time resolvido), PhasePill à DIREITA — espelha o
 * MatchCard. Corpo: grid [1fr_auto_1fr] com lado mandante (label/código fora
 * · bandeira pro centro), CAIXA CENTRAL de horário (borda na cor da fase), lado
 * visitante espelhado.
 *
 * Accent: cor da própria fase via phaseColorToken — injetada como CANAIS HSL
 * CRUS em `--accent-c` (gotcha-safe), igual ao MatchCard.
 */
function BracketMatchCard({ item }: { item: BracketNodeItem }) {
  const { t } = useTranslation('standings')
  const { bracket, resolvedHome, resolvedAway, kickoffAt, venue, venueCity } =
    item

  const accentToken = phaseColorToken(bracket.stage)
  // Caixa central: horário real do jogo do banco quando associável por ≥1 time
  // resolvido; senão "TBD".
  const centerLabel = kickoffAt ? timeOfDay(kickoffAt) : t('bracket.timeTbd')

  // Header-left: "Jogo N" sempre; quando o confronto tem jogo do banco
  // associado (≥1 time resolvido), uma sub-linha discreta com "data · local"
  // espelha o MatchCard (sectionDateLabel · venueLabel). Sem jogo associado
  // (nenhum time resolvido / sem fixture) → só "Jogo N", sem data/local.
  const matchNumber = t('bracket.matchNumber', { number: bracket.ref })
  const detailLine = [
    kickoffAt ? sectionDateLabel(kickoffAt) : '',
    venueLabel(venue, venueCity),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Surface
      as="article"
      variant="tonal"
      accent={accentToken}
      padding="none"
      className="animate-float-in relative overflow-hidden border-dashed"
    >
      {/* Header band tonal — contexto à esquerda, PhasePill à direita (espelha
          o MatchCard). */}
      <header className="flex items-center justify-between gap-2 bg-[hsl(var(--accent-c)_/_0.12)] px-4 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="min-w-0 truncate font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
            {matchNumber}
          </span>
          {detailLine && (
            <span className="min-w-0 truncate text-[10px] font-medium text-muted-foreground/70">
              {detailLine}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <PhasePill stage={bracket.stage} variant="solid" size="sm" />
        </div>
      </header>

      {/* Corpo horizontal: lado mandante · caixa TBD · lado visitante. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
        <BracketSide slot={bracket.home} team={resolvedHome} />
        <div className="rounded-xl border-2 border-[hsl(var(--accent-c))] px-3 py-1.5">
          <span className="font-display text-base font-bold uppercase tabular-nums text-muted-foreground">
            {centerLabel}
          </span>
        </div>
        <BracketSide slot={bracket.away} team={resolvedAway} mirror />
      </div>
    </Surface>
  )
}

/**
 * Um lado do BracketMatchCard, espelhando o ScheduledTeam do MatchCard:
 * [ código/label FORA · bandeira DENTRO ] (visitante espelha com `mirror`).
 *
 * - Resolvido (Team) → bandeira 36px + código (mesmo tamanho do MatchCard).
 * - Não resolvido → label do slot (ex "3º A/B/C/D/F"), com `text-balance` para
 *   quebrar em múltiplas linhas a 320px sem estourar.
 */
function BracketSide({
  slot,
  team,
  mirror,
}: {
  slot: BracketSlot
  team: Team | null
  mirror?: boolean
}) {
  const { t } = useTranslation('standings')

  const label = team ? (
    <span className="font-display truncate text-lg font-black uppercase leading-none">
      {team.code}
    </span>
  ) : (
    <span className="font-display text-balance text-xs font-bold uppercase leading-tight tracking-wide text-foreground/80">
      {formatSlotLabel(slot, t)}
    </span>
  )
  const flag = <TeamFlag team={team} size={36} />

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        mirror ? 'justify-start' : 'justify-end',
      )}
    >
      {mirror ? (
        <>
          {flag}
          {label}
        </>
      ) : (
        <>
          {label}
          {flag}
        </>
      )}
    </div>
  )
}

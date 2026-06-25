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
import { useGroupStandings } from '@/hooks/useGroupStandings'
import { useMatches, type MatchWithTeams } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { sectionDateLabel, timeOfDay } from '@/lib/format'
import { venueLabel } from '@/lib/venueCountry'
import { PHASE_LABEL_PT, phaseColorToken } from '@/lib/groupColors'
import { cn } from '@/lib/utils'
import type { TabSlug } from '@/lib/tournamentPhase'
import { emptyStateForTab } from '@/lib/tournamentPhase'
import {
  bracketMatchesForStage,
  buildBracketResolveContext,
  formatSlotLabel,
  hasBracketStructure,
  resolveSlot,
  type BracketMatch,
  type BracketResolveContext,
  type BracketSlot,
} from '@/lib/bracketStructure'

interface BracketPhaseProps {
  /** Stages incluídos nesta tab (ex: ['third_place', 'final']) */
  stages: ReadonlyArray<MatchStage>
  /** Slug usado pra empty state message */
  slug: TabSlug
}

/**
 * Um item da lista unificada da fase: SEMPRE um confronto oficial do config
 * (na ordem dos números de jogo, ex 73→88), resolvido contra a classificação.
 *
 * - `dbMatch` presente → o confronto tem registro real no banco (casado por
 *   IDENTIDADE DE TIME, não por contagem) → renderiza o MatchCard completo.
 * - `dbMatch` ausente → confronto previsto → renderiza o BracketMatchCard
 *   (espelho do MatchCard agendado, com label de slot + caixa de horário/TBD).
 */
interface BracketItem {
  bracket: BracketMatch
  resolvedHome: Team | null
  resolvedAway: Team | null
  /** Jogo do banco casado por par de times (ambos resolvidos). */
  dbMatch: MatchWithTeams | null
  /**
   * Horário do jogo do banco quando o confronto NÃO casou por par (cai no
   * BracketMatchCard) mas tem ≥1 slot resolvido e existe um registro da fase
   * contendo aquele time por id. Usado para a hora na caixa central e, junto
   * com `venue`/`venueCity`, para enriquecer o header com data · local.
   */
  kickoffAt: string | null
  /** Estádio do jogo do banco associado por ≥1 time resolvido (header). */
  venue: string | null
  /** Cidade do estádio do jogo do banco associado (header, via venueLabel). */
  venueCity: string | null
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
  const matches = useMatches()
  const standings = useGroupStandings()
  const predictions = useMyPredictions(auth.session?.user.id)
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  useRealtimeInvalidator({
    tables: ['matches'],
    queryKeys: [['matches'], ['group-standings']],
  })

  // Contexto de resolução de slots (1º/2º de grupos COMPLETOS → Team real).
  const resolveCtx = useMemo<BracketResolveContext>(
    () => buildBracketResolveContext(standings.data ?? []),
    [standings.data],
  )

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  /**
   * Lista unificada por stage. Para cada confronto do config resolvemos os
   * slots e tentamos casar um jogo do banco POR PAR DE TIMES. Um jogo só é
   * "consumido" por um confronto (Set de ids usados), evitando que dois
   * confrontos disputem o mesmo registro.
   */
  const sections = useMemo(() => {
    const phaseMatches = (matches.data ?? []).filter((m) =>
      stages.includes(m.stage),
    )

    return stages
      .filter(hasBracketStructure)
      .map((stage) => {
        const config = bracketMatchesForStage(stage)
        const dbForStage = phaseMatches.filter((m) => m.stage === stage)
        const usedDbIds = new Set<number>()

        // 1ª passada: casa confrontos por PAR de times (ambos resolvidos) →
        // MatchCard. Marca o jogo como consumido para não reaparecer abaixo.
        const items: BracketItem[] = config.map((bracket) => {
          const resolvedHome = resolveSlot(bracket.home, resolveCtx)
          const resolvedAway = resolveSlot(bracket.away, resolveCtx)

          let dbMatch: MatchWithTeams | null = null
          if (resolvedHome && resolvedAway) {
            const homeId = resolvedHome.id
            const awayId = resolvedAway.id
            dbMatch =
              dbForStage.find(
                (m) =>
                  !usedDbIds.has(m.id) &&
                  m.home_team_id != null &&
                  m.away_team_id != null &&
                  ((m.home_team_id === homeId && m.away_team_id === awayId) ||
                    (m.home_team_id === awayId && m.away_team_id === homeId)),
              ) ?? null
            if (dbMatch) usedDbIds.add(dbMatch.id)
          }

          return {
            bracket,
            resolvedHome,
            resolvedAway,
            dbMatch,
            kickoffAt: null,
            venue: null,
            venueCity: null,
          }
        })

        // 2ª passada: para os confrontos SEM par casado (vão virar
        // BracketMatchCard) mas com ≥1 slot resolvido, associa um jogo do banco
        // da fase que CONTENHA esse time por id — só para LER o horário. Um time
        // joga um único jogo por fase, então é inequívoco. Excluímos jogos já
        // consumidos como MatchCard (usedDbIds) para não duplicar leitura.
        for (const item of items) {
          if (item.dbMatch) continue
          const resolvedTeam = item.resolvedHome ?? item.resolvedAway
          if (!resolvedTeam) continue
          const teamId = resolvedTeam.id
          const dbWithTeam = dbForStage.find(
            (m) =>
              !usedDbIds.has(m.id) &&
              (m.home_team_id === teamId || m.away_team_id === teamId) &&
              m.kickoff_at != null,
          )
          if (dbWithTeam) {
            item.kickoffAt = dbWithTeam.kickoff_at
            item.venue = dbWithTeam.venue
            item.venueCity = dbWithTeam.venue_city
          }
        }

        return { stage, items }
      })
      .filter((s) => s.items.length > 0)
  }, [matches.data, stages, resolveCtx])

  if (matches.isPending) {
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

  if (matches.isError) {
    return (
      <Surface
        variant="notice"
        tone="destructive"
        as="p"
        className="text-sm"
        role="alert"
        aria-live="polite"
      >
        Erro ao carregar jogos: {(matches.error as Error).message}
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
function BracketMatchCard({ item }: { item: BracketItem }) {
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

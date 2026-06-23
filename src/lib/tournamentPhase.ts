import type { MatchStage } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'
import i18n from '@/i18n'

/**
 * Slugs das tabs da página /standings. Cada slug agrupa 1+ stages do banco.
 * 'final' agrupa third_place + final pra apresentar o fim do torneio juntos.
 */
export type TabSlug = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'

const TAB_STAGES: Record<TabSlug, ReadonlyArray<MatchStage>> = {
  group: ['group'],
  r32: ['round_of_32'],
  r16: ['round_of_16'],
  qf: ['quarter_final'],
  sf: ['semi_final'],
  final: ['third_place', 'final'],
}

const TAB_ORDER: ReadonlyArray<TabSlug> = [
  'group',
  'r32',
  'r16',
  'qf',
  'sf',
  'final',
]

/**
 * Returns the tabs array localized via i18n. Call inside React render or
 * after i18n is initialized.
 */
export function getTabs(): ReadonlyArray<{
  slug: TabSlug
  label: string
  stages: ReadonlyArray<MatchStage>
}> {
  return TAB_ORDER.map((slug) => ({
    slug,
    label: i18n.t(`tabs.${slug}`, { ns: 'standings' }),
    stages: TAB_STAGES[slug],
  }))
}

const STAGE_TO_SLUG: Record<MatchStage, TabSlug> = {
  group: 'group',
  round_of_32: 'r32',
  round_of_16: 'r16',
  quarter_final: 'qf',
  semi_final: 'sf',
  third_place: 'final',
  final: 'final',
}

export function tabForStage(stage: MatchStage): TabSlug {
  return STAGE_TO_SLUG[stage]
}

export function tabBySlug(slug: string): TabSlug | null {
  return TAB_ORDER.includes(slug as TabSlug) ? (slug as TabSlug) : null
}

export function stagesForTab(slug: TabSlug): ReadonlyArray<MatchStage> {
  return TAB_STAGES[slug]
}

/**
 * Primeira fase que ainda tem ao menos 1 jogo não-finalizado.
 * Fallback: última fase que tem jogos no banco (caso tudo esteja finished).
 * Fallback final: 'group' (estado pré-Copa).
 */
export function currentPhase(matches: MatchWithTeams[]): TabSlug {
  let lastWithMatches: TabSlug | null = null
  for (const slug of TAB_ORDER) {
    const stages = TAB_STAGES[slug]
    const list = matches.filter((m) => stages.includes(m.stage))
    if (list.length > 0) lastWithMatches = slug
    if (list.some((m) => m.status !== 'finished')) return slug
  }
  return lastWithMatches ?? 'group'
}

/**
 * Texto descritivo abaixo do PageHeader, por aba. Locale-aware via i18n.
 */
export function subtitleForTab(slug: TabSlug): string {
  return i18n.t(`subtitles.${slug}`, { ns: 'standings' })
}

/**
 * Mensagem do empty state quando a fase ainda não tem jogos sincronizados.
 */
export function emptyStateForTab(slug: TabSlug): string {
  const keyMap: Record<TabSlug, string> = {
    group: 'bracket.emptyGroup',
    r32: 'bracket.emptyR32',
    r16: 'bracket.emptyR16',
    qf: 'bracket.emptyQF',
    sf: 'bracket.emptySF',
    final: 'bracket.emptyFinal',
  }
  return i18n.t(keyMap[slug], { ns: 'standings' })
}

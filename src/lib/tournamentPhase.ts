import type { MatchStage } from '@/types/db'
import type { MatchWithTeams } from '@/hooks/useMatches'

/**
 * Slugs das tabs da página /standings. Cada slug agrupa 1+ stages do banco.
 * 'final' agrupa third_place + final pra apresentar o fim do torneio juntos.
 */
export type TabSlug = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'

export const TABS: ReadonlyArray<{
  slug: TabSlug
  label: string
  stages: ReadonlyArray<MatchStage>
}> = [
  { slug: 'group', label: 'Fase de Grupos', stages: ['group'] },
  { slug: 'r32', label: '32-avos', stages: ['round_of_32'] },
  { slug: 'r16', label: 'Oitavas', stages: ['round_of_16'] },
  { slug: 'qf', label: 'Quartas', stages: ['quarter_final'] },
  { slug: 'sf', label: 'Semi', stages: ['semi_final'] },
  { slug: 'final', label: 'Final', stages: ['third_place', 'final'] },
] as const

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
  return TABS.some((t) => t.slug === slug) ? (slug as TabSlug) : null
}

/**
 * Primeira fase que ainda tem ao menos 1 jogo não-finalizado.
 * Fallback: última fase que tem jogos no banco (caso tudo esteja finished).
 * Fallback final: 'group' (estado pré-Copa).
 */
export function currentPhase(matches: MatchWithTeams[]): TabSlug {
  let lastWithMatches: TabSlug | null = null
  for (const tab of TABS) {
    const list = matches.filter((m) => tab.stages.includes(m.stage))
    if (list.length > 0) lastWithMatches = tab.slug
    if (list.some((m) => m.status !== 'finished')) return tab.slug
  }
  return lastWithMatches ?? 'group'
}

/**
 * Texto descritivo abaixo do PageHeader, por aba.
 */
export function subtitleForTab(slug: TabSlug): string {
  switch (slug) {
    case 'group':
      return 'Top 2 de cada grupo + 8 melhores 3ºs vão pros 32-avos'
    case 'r32':
      return '16 jogos · eliminação simples'
    case 'r16':
      return '8 jogos · eliminação simples'
    case 'qf':
      return '4 jogos · eliminação simples'
    case 'sf':
      return '2 jogos · vencedores vão pra final'
    case 'final':
      return 'Disputa de 3º lugar + final do torneio'
  }
}

/**
 * Mensagem do empty state quando a fase ainda não tem jogos sincronizados.
 */
export function emptyStateForTab(slug: TabSlug): string {
  switch (slug) {
    case 'r32':
      return 'Chaveamento será preenchido após a fase de grupos (a partir de 27/06).'
    case 'r16':
      return 'Aguardando definição dos 32-avos.'
    case 'qf':
      return 'Aguardando definição das oitavas.'
    case 'sf':
      return 'Aguardando definição das quartas.'
    case 'final':
      return 'Aguardando definição das semifinais.'
    case 'group':
      return 'Nenhum jogo da fase de grupos encontrado.'
  }
}

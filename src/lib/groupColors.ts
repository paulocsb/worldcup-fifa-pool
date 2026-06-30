/**
 * Mapeia letra de grupo / fase de torneio / posição cerimonial para o
 * token de cor CSS variable correspondente.
 *
 * Usado pelos componentes Pill (GroupPill, PhasePill, PositionBadge) e
 * por consumidores que precisam tonalizar cards/bordas pela cor do grupo.
 *
 * Tokens definidos em src/index.css (light + dark).
 */

import type { CSSProperties } from 'react'
import type { MatchStage } from '@/types/db'

// ---------------------------------------------------------------------------
// Grupos A–L
// ---------------------------------------------------------------------------
export type GroupLetter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

const GROUP_TOKEN: Record<GroupLetter, string> = {
  A: 'group-a', B: 'group-b', C: 'group-c', D: 'group-d',
  E: 'group-e', F: 'group-f', G: 'group-g', H: 'group-h',
  I: 'group-i', J: 'group-j', K: 'group-k', L: 'group-l',
}

/**
 * Foreground (texto/ícone) ideal sobre o background de cada grupo no variant
 * solid. true = usar branco; false = usar dark foreground.
 * Calculado manualmente com base no lightness do HSL definido em index.css.
 * Grupos com bg escuro (lightness < 55%) precisam de texto branco.
 */
const GROUP_NEEDS_LIGHT_FG: Record<GroupLetter, boolean> = {
  A: false, // 142 71% 58% - claro
  B: false, // 0 84% 60%   - claro
  C: false, // 25 95% 53%  - claro
  D: true,  // 226 71% 40% - escuro
  E: true,  // 271 81% 56% - misto, mas saturado escuro
  F: false, // 48 96% 53%  - claro (amarelo)
  G: false, // 330 81% 60% - claro
  H: false, // 187 85% 53% - ciano claro
  I: true,  // 215 16% 47% - slate escuro
  J: true,  // 158 64% 39% - emerald escuro
  K: false, // 11 86% 65%  - coral claro
  L: false, // 199 89% 60% - sky claro
}

export function groupColorToken(letter: string | null | undefined): string | null {
  if (!letter) return null
  const upper = letter.toUpperCase() as GroupLetter
  return GROUP_TOKEN[upper] ?? null
}

export function groupNeedsLightFg(letter: string | null | undefined): boolean {
  if (!letter) return false
  const upper = letter.toUpperCase() as GroupLetter
  return GROUP_NEEDS_LIGHT_FG[upper] ?? false
}

export function isGroupLetter(s: string | null | undefined): s is GroupLetter {
  return !!s && Object.hasOwn(GROUP_TOKEN, s.toUpperCase())
}

// ---------------------------------------------------------------------------
// Fases do torneio
// ---------------------------------------------------------------------------
const PHASE_TOKEN: Record<MatchStage, string> = {
  group: 'phase-group',
  round_of_32: 'phase-r32',
  round_of_16: 'phase-r16',
  quarter_final: 'phase-quarter',
  semi_final: 'phase-semi',
  third_place: 'phase-third',
  final: 'phase-final',
}

/** Fases com bg escuro precisam de texto branco no solid variant */
const PHASE_NEEDS_LIGHT_FG: Record<MatchStage, boolean> = {
  group: false,        // 142 71% 45% — médio
  round_of_32: true,   // 271 81% 56% — púrpura escuro
  round_of_16: false,  // 25 95% 53%
  quarter_final: false,// 84 81% 50%
  semi_final: false,   // 187 85% 53%
  third_place: false,  // 32 95% 44% — bronze médio
  final: false,        // 48 96% 53% — amarelo brilhante
}

export function phaseColorToken(stage: MatchStage): string {
  return PHASE_TOKEN[stage]
}

export function phaseNeedsLightFg(stage: MatchStage): boolean {
  return PHASE_NEEDS_LIGHT_FG[stage]
}

export const PHASE_LABEL_PT: Record<MatchStage, string> = {
  group: 'Fase de grupos',
  round_of_32: '16-avos',
  round_of_16: 'Oitavas',
  quarter_final: 'Quartas',
  semi_final: 'Semifinal',
  third_place: '3º lugar',
  final: 'Final',
}

// Versão curta para pills em mobile
export const PHASE_LABEL_SHORT_PT: Record<MatchStage, string> = {
  group: 'Grupos',
  round_of_32: '16-avos',
  round_of_16: 'Oitavas',
  quarter_final: 'QF',
  semi_final: 'SF',
  third_place: '3º',
  final: 'Final',
}

// ---------------------------------------------------------------------------
// Posições cerimoniais
// ---------------------------------------------------------------------------
export type CeremonialPosition = 'gold' | 'silver' | 'bronze'

const POSITION_TOKEN: Record<CeremonialPosition, string> = {
  gold: 'accent-gold',
  silver: 'accent-silver',
  bronze: 'accent-bronze',
}

export function positionColorToken(pos: CeremonialPosition): string {
  return POSITION_TOKEN[pos]
}

export function positionFromRank(rank: number): CeremonialPosition | null {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return null
}

// ---------------------------------------------------------------------------
// Accent channel injection (design system)
// ---------------------------------------------------------------------------
/**
 * Devolve um style que injeta `--accent-c` com os CANAIS HSL CRUS do token
 * (ex.: `{ '--accent-c': 'var(--group-e)' }` resolve para "271 81% 56%").
 *
 * NUNCA devolve `hsl(...)` pronto: o Tailwind v3 descarta o modificador
 * `/opacity` em cores arbitrárias quando o var() já contém uma cor completa.
 * Mantendo os canais crus, o consumidor aplica opacidade real via
 * `border-[hsl(var(--accent-c)_/_0.45)]` etc. (mesma fórmula do MatchCard).
 *
 * Aceita:
 * - token semântico já resolvido por groupColorToken/phaseColorToken/
 *   positionColorToken (ex.: 'group-e', 'phase-final', 'accent-gold');
 * - nome de CSS var sem o `--` (ex.: 'primary', 'destructive');
 * - uma expressão `var(...)` ou canais crus já prontos (passa direto).
 */
export function accentVarStyle(token: string): CSSProperties {
  const trimmed = token.trim()
  // Já é uma expressão var(...) ou canais crus ("271 81% 56%") → usa como está.
  const value =
    trimmed.startsWith('var(') || /^\d/.test(trimmed)
      ? trimmed
      : `var(--${trimmed.replace(/^--/, '')})`
  return { '--accent-c': value } as CSSProperties
}

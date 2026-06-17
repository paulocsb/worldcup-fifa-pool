/**
 * Tipos das respostas relevantes de API-Football v3 que armazenamos como JSONB.
 * Mantidos do lado do cliente apenas para renderização (não validamos no recv).
 */

export interface ApiTeamRef {
  id: number
  name: string
  logo: string | null
}

export interface ApiPlayerRef {
  id: number
  name: string
  number?: number
  pos?: string | null
  grid?: string | null
}

// ----- LINEUPS ---------------------------------------------------------------
export interface ApiLineup {
  team: ApiTeamRef & { colors?: unknown }
  coach: { id: number | null; name: string | null; photo?: string | null }
  formation: string | null
  startXI: Array<{ player: ApiPlayerRef }>
  substitutes: Array<{ player: ApiPlayerRef }>
}

// ----- EVENTS ----------------------------------------------------------------
export type ApiEventType = 'Goal' | 'Card' | 'subst' | 'Var' | string

export interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: ApiTeamRef
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: ApiEventType
  detail: string
  comments?: string | null
}

// ----- STATISTICS ------------------------------------------------------------
export interface ApiTeamStatistics {
  team: ApiTeamRef
  statistics: Array<{ type: string; value: string | number | null }>
}

// ---------------------------------------------------------------------------
// Cliente API-Football (api-sports.io).
// Docs: https://www.api-football.com/documentation-v3
// ---------------------------------------------------------------------------

const BASE = 'https://v3.football.api-sports.io'

export interface ApiTeam {
  id: number
  name: string
  logo: string | null
}

export interface ApiFixture {
  fixture: {
    id: number
    date: string // ISO
    status: {
      short: string
      long: string
      /** Minuto corrido (1H/2H/ET). null fora do estado live */
      elapsed: number | null
      /** Acréscimos exibidos */
      extra?: number | null
    }
    venue: { id: number | null; name: string | null; city: string | null }
  }
  league: {
    id: number
    season: number
    round: string // ex: "Group Stage - 1", "Round of 32"
  }
  teams: {
    home: ApiTeam
    away: ApiTeam
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    extratime: { home: number | null; away: number | null }
    penalty: { home: number | null; away: number | null }
  }
}

interface ApiResponse<T> {
  get: string
  parameters: Record<string, string>
  errors: unknown[]
  results: number
  paging: { current: number; total: number }
  response: T
}

export class ApiFootballClient {
  constructor(private readonly apiKey: string) {}

  async fixtures(opts: {
    league: number | string
    season: number | string
    /** ISO date YYYY-MM-DD; restringe a um dia */
    date?: string
    /** YYYY-MM-DD; usado com `to` para range */
    from?: string
    to?: string
  }): Promise<ApiFixture[]> {
    const url = new URL(`${BASE}/fixtures`)
    url.searchParams.set('league', String(opts.league))
    url.searchParams.set('season', String(opts.season))
    if (opts.date) url.searchParams.set('date', opts.date)
    if (opts.from) url.searchParams.set('from', opts.from)
    if (opts.to) url.searchParams.set('to', opts.to)

    const res = await fetch(url, {
      headers: { 'x-apisports-key': this.apiKey },
    })
    if (!res.ok) {
      throw new Error(`API-Football ${res.status}: ${await res.text()}`)
    }
    const body = (await res.json()) as ApiResponse<ApiFixture[]>
    const errs = body.errors
    if (errs) {
      const hasErrors = Array.isArray(errs) ? errs.length > 0 : Object.keys(errs).length > 0
      if (hasErrors) {
        throw new Error(`API-Football errors: ${JSON.stringify(errs)}`)
      }
    }
    return body.response
  }

  /** Busca uma fixture específica por ID (independente de data). */
  async fixtureById(id: number): Promise<ApiFixture | null> {
    const url = new URL(`${BASE}/fixtures`)
    url.searchParams.set('id', String(id))
    const res = await fetch(url, {
      headers: { 'x-apisports-key': this.apiKey },
    })
    if (!res.ok) {
      throw new Error(`API-Football fixtureById ${res.status}: ${await res.text()}`)
    }
    const body = (await res.json()) as ApiResponse<ApiFixture[]>
    const errs = body.errors
    if (errs) {
      const hasErrors = Array.isArray(errs) ? errs.length > 0 : Object.keys(errs).length > 0
      if (hasErrors) {
        throw new Error(`API-Football fixtureById errors: ${JSON.stringify(errs)}`)
      }
    }
    return body.response?.[0] ?? null
  }

  async lineups(fixtureId: number): Promise<unknown[]> {
    return this.getJsonArray('/fixtures/lineups', { fixture: String(fixtureId) })
  }

  async events(fixtureId: number): Promise<unknown[]> {
    return this.getJsonArray('/fixtures/events', { fixture: String(fixtureId) })
  }

  async statistics(fixtureId: number): Promise<unknown[]> {
    return this.getJsonArray('/fixtures/statistics', { fixture: String(fixtureId) })
  }

  private async getJsonArray(path: string, params: Record<string, string>): Promise<unknown[]> {
    const url = new URL(`${BASE}${path}`)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url, { headers: { 'x-apisports-key': this.apiKey } })
    if (!res.ok) {
      throw new Error(`API-Football ${path} ${res.status}: ${await res.text()}`)
    }
    const body = (await res.json()) as ApiResponse<unknown[]>
    const errs = body.errors
    if (errs) {
      const hasErrors = Array.isArray(errs) ? errs.length > 0 : Object.keys(errs).length > 0
      if (hasErrors) throw new Error(`API-Football ${path} errors: ${JSON.stringify(errs)}`)
    }
    return body.response ?? []
  }
}

// ---------------------------------------------------------------------------
// Mapeamento status / stage
// ---------------------------------------------------------------------------

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled'

export function mapStatus(apiShort: string): MatchStatus {
  // https://www.api-football.com/documentation-v3#tag/Fixtures
  if (['NS', 'TBD'].includes(apiShort)) return 'scheduled'
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(apiShort))
    return 'live'
  if (['FT', 'AET', 'PEN'].includes(apiShort)) return 'finished'
  return 'cancelled' // PST, CANC, ABD, AWD, WO, SUSP
}

export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final'

export function mapStage(round: string): MatchStage {
  const r = round.toLowerCase()
  if (r.includes('group stage')) return 'group'
  if (r.includes('round of 32')) return 'round_of_32'
  if (r.includes('round of 16')) return 'round_of_16'
  if (r.includes('quarter')) return 'quarter_final'
  if (r.includes('semi')) return 'semi_final'
  if (r.includes('3rd place') || r.includes('third place')) return 'third_place'
  if (r.includes('final')) return 'final'
  throw new Error(`Stage desconhecida: "${round}"`)
}

/** Extrai o número da rodada (matchday) de uma string de round.
 *  Ex.: "Group Stage - 2" → 2. Retorna null se não for fase de grupos. */
export function parseMatchday(round: string): number | null {
  const m = round.match(/group stage\s*-\s*(\d+)/i)
  return m ? Number(m[1]) : null
}

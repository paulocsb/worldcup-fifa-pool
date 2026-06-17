// ---------------------------------------------------------------------------
// sync-match-detail
//
// Busca lineups + events + statistics de uma partida específica e salva nas
// colunas JSONB de matches. Idempotente, com TTL:
//   - status='live'      → refetch se detail_synced_at > 60s atrás
//   - status='finished'  → fetch só se nunca foi sincronizado
//   - status='scheduled' → fetch só se nunca foi sincronizado (lineups saem ~1h antes)
//
// Uso:
//   curl -X POST .../functions/v1/sync-match-detail -d '{"match_id": 1489413}'
//   ?force=1 ignora o TTL
// ---------------------------------------------------------------------------

import { createClient } from 'npm:@supabase/supabase-js@2'
import { ApiFootballClient } from '../_shared/api-football.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_KEY = Deno.env.get('API_FOOTBALL_KEY')

const LIVE_TTL_MS = 60_000

interface Report {
  ok: boolean
  match_id: number | null
  refetched: boolean
  cached: boolean
  errors: string[]
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'
  let matchId: number | null = null
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body?.match_id != null) matchId = Number(body.match_id)
    } catch {
      // body opcional via query
    }
  }
  if (matchId == null) {
    const q = url.searchParams.get('match_id')
    if (q) matchId = Number(q)
  }

  const report: Report = {
    ok: false,
    match_id: matchId,
    refetched: false,
    cached: false,
    errors: [],
  }

  if (matchId == null || Number.isNaN(matchId)) {
    report.errors.push('match_id obrigatório (body { match_id } ou query ?match_id=)')
    return json(report, 400)
  }
  if (!API_KEY) {
    report.errors.push('API_FOOTBALL_KEY ausente')
    return json(report, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id, status, detail_synced_at')
    .eq('id', matchId)
    .maybeSingle()
  if (matchErr) {
    report.errors.push(`select match: ${matchErr.message}`)
    return json(report, 500)
  }
  if (!match) {
    report.errors.push(`match ${matchId} não existe`)
    return json(report, 404)
  }

  // ---------------------------------------------------------------------------
  // TTL: pode pular?
  // ---------------------------------------------------------------------------
  if (!force && match.detail_synced_at) {
    const synced = new Date(match.detail_synced_at).getTime()
    const ageMs = Date.now() - synced
    const isLive = match.status === 'live'
    if (!isLive || ageMs < LIVE_TTL_MS) {
      report.ok = true
      report.cached = true
      return json(report, 200)
    }
  }

  const api = new ApiFootballClient(API_KEY)
  try {
    const [lineups, events, statistics] = await Promise.all([
      api.lineups(matchId),
      api.events(matchId),
      api.statistics(matchId),
    ])

    const { error: updErr } = await supabase
      .from('matches')
      .update({
        lineups,
        events,
        statistics,
        detail_synced_at: new Date().toISOString(),
      })
      .eq('id', matchId)
    if (updErr) {
      report.errors.push(`update match: ${updErr.message}`)
      return json(report, 500)
    }
    report.refetched = true
    report.ok = true
    return json(report, 200)
  } catch (err) {
    report.errors.push(`fetch detail: ${(err as Error).message}`)
    return json(report, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

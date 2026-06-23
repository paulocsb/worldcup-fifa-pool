// ---------------------------------------------------------------------------
// sync-live
//
// Atualiza placar/status de partidas. Faz fetch num range de 2 dias UTC
// (ontem + hoje) pra cobrir partidas que cruzam meia-noite UTC. Adicional-
// mente, partidas com status='live' no DB que NÃO apareceram no response
// (geralmente porque ficaram presas há mais de 2 dias) são buscadas indivi-
// dualmente por ID. Após atualizar, se houver transição para 'finished',
// invoca compute-scores internamente.
//
// Uso:
//   curl -X POST .../functions/v1/sync-live                   # padrão: ontem+hoje
//   curl -X POST .../functions/v1/sync-live -d '{"date":"2026-06-17"}'  # único dia
//
// Pensado para rodar a cada 30-60s durante dias de jogo (via pg_cron ou
// scheduler externo). Em dias sem jogo retorna rapidamente (0 fixtures).
// ---------------------------------------------------------------------------

import { createClient } from 'npm:@supabase/supabase-js@2'
import { ApiFootballClient, mapStatus } from '../_shared/api-football.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_KEY = Deno.env.get('API_FOOTBALL_KEY')
const LEAGUE_ID = Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? '1'
const SEASON = Deno.env.get('API_FOOTBALL_SEASON') ?? '2026'

interface SyncLiveReport {
  ok: boolean
  range: string
  fixtures_returned: number
  stuck_rescued: number
  matches_updated: number
  matches_unchanged: number
  newly_finished: number[]
  compute_scores_triggered: boolean
  errors: string[]
}

Deno.serve(async (req) => {
  const report: SyncLiveReport = {
    ok: false,
    range: '',
    fixtures_returned: 0,
    stuck_rescued: 0,
    matches_updated: 0,
    matches_unchanged: 0,
    newly_finished: [],
    compute_scores_triggered: false,
    errors: [],
  }

  // Default: range ontem+hoje UTC. Override: { date: 'YYYY-MM-DD' } pra dia único.
  let from = utcDateOffset(-1)
  let to = utcDateOffset(0)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body?.date) {
        from = String(body.date)
        to = String(body.date)
      }
    } catch {
      // body opcional
    }
  }
  report.range = from === to ? from : `${from}..${to}`

  if (!API_KEY) {
    report.errors.push('API_FOOTBALL_KEY ausente')
    return json(report, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const api = new ApiFootballClient(API_KEY)

  let fixtures
  try {
    fixtures =
      from === to
        ? await api.fixtures({ league: LEAGUE_ID, season: SEASON, date: from })
        : await api.fixtures({ league: LEAGUE_ID, season: SEASON, from, to })
    report.fixtures_returned = fixtures.length
  } catch (err) {
    report.errors.push(`fetch: ${(err as Error).message}`)
    return json(report, 500)
  }

  // Rede de segurança: partidas com status='live' no DB que NÃO apareceram no
  // response (presas há mais de 2 dias). Busca cada uma individualmente por ID.
  try {
    const seenIds = new Set(fixtures.map((f) => f.fixture.id))
    const { data: stuck } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'live')
    const stuckIds =
      stuck?.map((m) => m.id as number).filter((id) => !seenIds.has(id)) ?? []
    for (const id of stuckIds) {
      try {
        const f = await api.fixtureById(id)
        if (f) {
          fixtures.push(f)
          report.stuck_rescued += 1
        }
      } catch (err) {
        report.errors.push(`stuck m=${id}: ${(err as Error).message}`)
      }
    }
  } catch (err) {
    report.errors.push(`stuck-scan: ${(err as Error).message}`)
  }

  for (const f of fixtures) {
    const newStatus = mapStatus(f.fixture.status.short)

    // Lê o estado atual para saber se houve transição
    const { data: current, error: currErr } = await supabase
      .from('matches')
      .select(
        'status, home_score, away_score, elapsed_minutes, elapsed_extra_minutes, live_status_short',
      )
      .eq('id', f.fixture.id)
      .maybeSingle()
    if (currErr) {
      report.errors.push(`select m=${f.fixture.id}: ${currErr.message}`)
      continue
    }
    if (!current) {
      // match ainda não foi importado pelo sync-fixtures; ignora
      continue
    }

    const update = {
      status: newStatus,
      home_score:
        newStatus === 'finished' || newStatus === 'live' ? f.goals.home : null,
      away_score:
        newStatus === 'finished' || newStatus === 'live' ? f.goals.away : null,
      home_score_extra: f.score.extratime.home,
      away_score_extra: f.score.extratime.away,
      home_score_penalties: f.score.penalty.home,
      away_score_penalties: f.score.penalty.away,
      elapsed_minutes: newStatus === 'live' ? f.fixture.status.elapsed : null,
      elapsed_extra_minutes:
        newStatus === 'live' ? (f.fixture.status.extra ?? null) : null,
      live_status_short: newStatus === 'live' ? f.fixture.status.short : null,
      last_synced_at: new Date().toISOString(),
    }

    const changed =
      current.status !== update.status ||
      current.home_score !== update.home_score ||
      current.away_score !== update.away_score ||
      current.elapsed_minutes !== update.elapsed_minutes ||
      current.elapsed_extra_minutes !== update.elapsed_extra_minutes ||
      current.live_status_short !== update.live_status_short

    if (!changed) {
      report.matches_unchanged += 1
      continue
    }

    const { error: updErr } = await supabase
      .from('matches')
      .update(update)
      .eq('id', f.fixture.id)
    if (updErr) {
      report.errors.push(`update m=${f.fixture.id}: ${updErr.message}`)
      continue
    }
    report.matches_updated += 1

    if (current.status !== 'finished' && newStatus === 'finished') {
      report.newly_finished.push(f.fixture.id)
    }
  }

  // Dispara compute-scores apenas se houve transição para finished
  if (report.newly_finished.length > 0) {
    try {
      const cs = await fetch(`${SUPABASE_URL}/functions/v1/compute-scores`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({}),
      })
      report.compute_scores_triggered = cs.ok
      if (!cs.ok) {
        report.errors.push(`compute-scores: HTTP ${cs.status}`)
      }
    } catch (err) {
      report.errors.push(`compute-scores invoke: ${(err as Error).message}`)
    }
  }

  report.ok = report.errors.length === 0
  return json(report, report.ok ? 200 : 207)
})

/** Retorna YYYY-MM-DD UTC com offset em dias (0 = hoje, -1 = ontem). */
function utcDateOffset(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

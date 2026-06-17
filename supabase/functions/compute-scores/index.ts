// ---------------------------------------------------------------------------
// compute-scores
//
// Função idempotente que calcula pontos das predictions cujas matches já
// terminaram. Respeita scoring_config.scoring_start_at (jogos antes do cutoff
// não pontuam para preservar equidade do bolão).
//
// Uso:
//   curl -X POST .../functions/v1/compute-scores
//   curl -X POST .../functions/v1/compute-scores -d '{"match_id": 1489412}'
//
// Sem body: processa TODOS os matches finished pós-cutoff sem score gravado.
// Com body { match_id }: processa apenas esse jogo (idempotente).
// ---------------------------------------------------------------------------

import { createClient } from 'npm:@supabase/supabase-js@2'
import { DEFAULT_SCORING, scoreMatch, type ScoringConfig } from '../_shared/scoring.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ComputeReport {
  ok: boolean
  matches_evaluated: number
  matches_pre_cutoff_skipped: number
  predictions_scored: number
  total_points_awarded: number
  errors: string[]
}

Deno.serve(async (req) => {
  const report: ComputeReport = {
    ok: false,
    matches_evaluated: 0,
    matches_pre_cutoff_skipped: 0,
    predictions_scored: 0,
    total_points_awarded: 0,
    errors: [],
  }

  let requestedMatchId: number | null = null
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body?.match_id) requestedMatchId = Number(body.match_id)
    } catch {
      // body opcional
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // -------------------------------------------------------------------------
  // Lê scoring_config
  // -------------------------------------------------------------------------
  const { data: configRows, error: configErr } = await supabase
    .from('scoring_config')
    .select('key, value')
  if (configErr) {
    report.errors.push(`scoring_config: ${configErr.message}`)
    return json(report, 500)
  }

  const configByKey = new Map<string, unknown>(
    (configRows ?? []).map((r) => [r.key, r.value]),
  )
  const scoring: ScoringConfig = {
    match: (configByKey.get('match') as ScoringConfig['match']) ?? DEFAULT_SCORING.match,
    group: (configByKey.get('group') as ScoringConfig['group']) ?? DEFAULT_SCORING.group,
    tournament:
      (configByKey.get('tournament') as ScoringConfig['tournament']) ??
      DEFAULT_SCORING.tournament,
  }
  const matchdayStart = Number(
    configByKey.get('group_matchday_start') ?? 2,
  )

  // -------------------------------------------------------------------------
  // Busca matches finished
  // -------------------------------------------------------------------------
  let q = supabase
    .from('matches')
    .select('id, home_score, away_score, status, stage, matchday')
    .eq('status', 'finished')
  if (requestedMatchId) q = q.eq('id', requestedMatchId)

  const { data: matches, error: matchesErr } = await q
  if (matchesErr) {
    report.errors.push(`matches: ${matchesErr.message}`)
    return json(report, 500)
  }

  for (const m of matches ?? []) {
    report.matches_evaluated += 1

    // Cutoff por matchday: pula MD1 da fase de grupos (config: group_matchday_start)
    if (m.stage === 'group') {
      const md = m.matchday ?? 1
      if (md < matchdayStart) {
        report.matches_pre_cutoff_skipped += 1
        continue
      }
    }
    if (m.home_score == null || m.away_score == null) {
      report.errors.push(`match ${m.id}: finished sem placar`)
      continue
    }

    const { data: predictions, error: predErr } = await supabase
      .from('predictions')
      .select('user_id, home_score, away_score')
      .eq('match_id', m.id)
    if (predErr) {
      report.errors.push(`predictions m=${m.id}: ${predErr.message}`)
      continue
    }

    if (!predictions || predictions.length === 0) continue

    const rows = predictions.map((p) => {
      const result = scoreMatch(
        {
          predicted_home: p.home_score,
          predicted_away: p.away_score,
          actual_home: m.home_score!,
          actual_away: m.away_score!,
        },
        scoring,
      )
      report.predictions_scored += 1
      report.total_points_awarded += result.points
      return {
        user_id: p.user_id,
        source: 'match' as const,
        match_id: m.id,
        group_letter: null,
        points: result.points,
        breakdown: result.breakdown,
        computed_at: new Date().toISOString(),
      }
    })

    const { error: upsertErr } = await supabase
      .from('scores')
      .upsert(rows, { onConflict: 'user_id,source,match_id,group_letter' })
    if (upsertErr) {
      report.errors.push(`upsert scores m=${m.id}: ${upsertErr.message}`)
    }
  }

  report.ok = report.errors.length === 0
  return json(report, report.ok ? 200 : 207)
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

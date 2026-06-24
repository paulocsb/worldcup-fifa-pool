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
  scores_changed: boolean
  snapshot_users: number
  errors: string[]
}

interface ScoreRow {
  user_id: string
  source: 'match'
  match_id: number
  group_letter: null
  points: number
  breakdown: Record<string, unknown>
  computed_at: string
}

Deno.serve(async (req) => {
  const report: ComputeReport = {
    ok: false,
    matches_evaluated: 0,
    matches_pre_cutoff_skipped: 0,
    predictions_scored: 0,
    total_points_awarded: 0,
    scores_changed: false,
    snapshot_users: 0,
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

  // Acumula TODAS as linhas de score desta rodada (todos os matches avaliados)
  // antes de comparar com o estado atual e fazer o upsert.
  const allRows: ScoreRow[] = []

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
      } satisfies ScoreRow
    })

    allRows.push(...rows)
  }

  // -------------------------------------------------------------------------
  // Detecção de mudança: comparar os scores computados nesta rodada com os
  // já gravados. hasChanges = existe linha nova OU com `points` diferente.
  // -------------------------------------------------------------------------
  let hasChanges = false
  if (allRows.length > 0) {
    const matchIds = [...new Set(allRows.map((r) => r.match_id))]
    const { data: existing, error: existErr } = await supabase
      .from('scores')
      .select('user_id, match_id, points')
      .eq('source', 'match')
      .in('match_id', matchIds)
    if (existErr) {
      report.errors.push(`existing scores: ${existErr.message}`)
    }
    const existingPoints = new Map<string, number>()
    for (const e of existing ?? []) {
      existingPoints.set(`${e.user_id}|${e.match_id}`, e.points)
    }
    hasChanges = allRows.some((r) => {
      const prev = existingPoints.get(`${r.user_id}|${r.match_id}`)
      return prev === undefined || prev !== r.points
    })
  }
  report.scores_changed = hasChanges

  // -------------------------------------------------------------------------
  // Snapshot (best-effort): SÓ quando há mudança, captura os agregados ATUAIS
  // (pré-upsert) de todos os usuários a partir de `scores` source='match'.
  // Falha aqui não impede o upsert dos scores (cálculo é mais crítico).
  // -------------------------------------------------------------------------
  if (hasChanges) {
    try {
      const snapshotRows = await buildSnapshotRows(supabase)
      if (snapshotRows.length > 0) {
        const { error: snapErr } = await supabase
          .from('ranking_snapshot')
          .upsert(snapshotRows, { onConflict: 'user_id' })
        if (snapErr) {
          report.errors.push(`ranking_snapshot upsert: ${snapErr.message}`)
        } else {
          report.snapshot_users = snapshotRows.length
        }
      }
    } catch (e) {
      report.errors.push(`ranking_snapshot: ${String(e)}`)
    }
    console.log(
      `compute-scores: scores changed, ranking_snapshot captured for ${report.snapshot_users} users`,
    )
  } else {
    console.log('compute-scores: no score changes, ranking_snapshot untouched')
  }

  // -------------------------------------------------------------------------
  // Upsert dos scores. Otimização: só quando há mudança (idempotente de
  // qualquer forma; pular evita writes desnecessários no cron horário).
  // -------------------------------------------------------------------------
  if (hasChanges && allRows.length > 0) {
    const { error: upsertErr } = await supabase
      .from('scores')
      .upsert(allRows, { onConflict: 'user_id,source,match_id,group_letter' })
    if (upsertErr) {
      report.errors.push(`upsert scores: ${upsertErr.message}`)
    }
  }

  report.ok = report.errors.length === 0
  return json(report, report.ok ? 200 : 207)
})

// ---------------------------------------------------------------------------
// Agrega os scores ATUAIS (source='match') por usuário, espelhando o
// comparador do ranking (total_points / exact_count / scored_count).
// Em memória: o bolão é pequeno (dezenas de users × ~100 jogos).
// ---------------------------------------------------------------------------
async function buildSnapshotRows(
  supabase: ReturnType<typeof createClient>,
): Promise<
  Array<{
    user_id: string
    total_points: number
    exact_count: number
    scored_count: number
    captured_at: string
  }>
> {
  const { data, error } = await supabase
    .from('scores')
    .select('user_id, points, breakdown')
    .eq('source', 'match')
  if (error) throw new Error(error.message)

  const agg = new Map<
    string,
    { total_points: number; exact_count: number; scored_count: number }
  >()
  for (const s of data ?? []) {
    if (!s.user_id) continue
    const breakdown = s.breakdown as { exact?: number } | null
    const cur = agg.get(s.user_id) ?? {
      total_points: 0,
      exact_count: 0,
      scored_count: 0,
    }
    cur.total_points += s.points ?? 0
    cur.scored_count += 1
    if ((breakdown?.exact ?? 0) > 0) cur.exact_count += 1
    agg.set(s.user_id, cur)
  }

  const capturedAt = new Date().toISOString()
  return [...agg.entries()].map(([user_id, v]) => ({
    user_id,
    total_points: v.total_points,
    exact_count: v.exact_count,
    scored_count: v.scored_count,
    captured_at: capturedAt,
  }))
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

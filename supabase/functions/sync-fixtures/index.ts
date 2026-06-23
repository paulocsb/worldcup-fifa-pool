// ---------------------------------------------------------------------------
// sync-fixtures
//
// Busca todas as fixtures da Copa em API-Football e popula tabelas
// public.teams (atualiza api_team_id, logo) + public.matches (upsert por id).
//
// Uso:
//   supabase functions invoke sync-fixtures --no-verify-jwt
//
// Env vars (definir em supabase/.env.local — copiar .env.example):
//   API_FOOTBALL_KEY        chave api-sports.io
//   API_FOOTBALL_LEAGUE_ID  default 1 (World Cup); override se necessário
//   API_FOOTBALL_SEASON     default 2026
// ---------------------------------------------------------------------------

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  ApiFootballClient,
  mapStage,
  mapStatus,
  parseMatchday,
  type ApiFixture,
} from '../_shared/api-football.ts'
import { resolvePtName } from '../_shared/team-aliases.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_KEY = Deno.env.get('API_FOOTBALL_KEY')
const LEAGUE_ID = Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? '1'
const SEASON = Deno.env.get('API_FOOTBALL_SEASON') ?? '2026'

interface SyncReport {
  ok: boolean
  fixtures_returned: number
  teams_linked: number
  teams_unmapped: string[]
  matches_upserted: number
  matches_skipped: number
  errors: string[]
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const report: SyncReport = {
    ok: false,
    fixtures_returned: 0,
    teams_linked: 0,
    teams_unmapped: [],
    matches_upserted: 0,
    matches_skipped: 0,
    errors: [],
  }

  if (!API_KEY) {
    report.errors.push('API_FOOTBALL_KEY ausente em supabase/.env.local')
    return json(report, 500)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const api = new ApiFootballClient(API_KEY)

  let fixtures: ApiFixture[] = []
  try {
    fixtures = await api.fixtures({ league: LEAGUE_ID, season: SEASON })
    report.fixtures_returned = fixtures.length
  } catch (err) {
    report.errors.push(`fetch fixtures: ${(err as Error).message}`)
    return json(report, 500)
  }

  // -------------------------------------------------------------------------
  // Etapa 1: resolver mapa api_team_id → local team id
  // -------------------------------------------------------------------------
  const { data: localTeams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name, api_team_id')
  if (teamsErr) {
    report.errors.push(`select teams: ${teamsErr.message}`)
    return json(report, 500)
  }
  const byPtName = new Map<string, { id: number; api_team_id: number | null }>()
  for (const t of localTeams ?? []) {
    byPtName.set(t.name, { id: t.id, api_team_id: t.api_team_id })
  }

  // Coleta times únicos das fixtures
  const apiTeams = new Map<number, { name: string; logo: string | null }>()
  for (const f of fixtures) {
    apiTeams.set(f.teams.home.id, {
      name: f.teams.home.name,
      logo: f.teams.home.logo,
    })
    apiTeams.set(f.teams.away.id, {
      name: f.teams.away.name,
      logo: f.teams.away.logo,
    })
  }

  // Map api_team_id → local id
  const apiIdToLocal = new Map<number, number>()
  for (const [apiId, apiTeam] of apiTeams) {
    const ptName = resolvePtName(apiTeam.name)
    if (!ptName) {
      report.teams_unmapped.push(`${apiTeam.name} (api id=${apiId})`)
      continue
    }
    const local = byPtName.get(ptName)
    if (!local) {
      report.teams_unmapped.push(
        `${apiTeam.name} → PT "${ptName}" não existe em teams`,
      )
      continue
    }
    apiIdToLocal.set(apiId, local.id)

    // Atualiza api_team_id quando ainda não está mapeado.
    // NOTA: NÃO sobrescrever flag_url com apiTeam.logo — o api-sports.io
    // serve crests/logos quadrados 150x150 (transparência ao redor), que
    // ficam pequenos quando rendered como background-cover num círculo.
    // O seed inicial usa flagcdn.com (bandeiras horizontais reais) e isso
    // funciona melhor pro nosso TeamFlag.
    if (local.api_team_id !== apiId) {
      const { error: updErr } = await supabase
        .from('teams')
        .update({ api_team_id: apiId })
        .eq('id', local.id)
      if (updErr) {
        report.errors.push(`update team ${local.id}: ${updErr.message}`)
      } else {
        report.teams_linked += 1
      }
    }
  }

  // -------------------------------------------------------------------------
  // Etapa 2: upsert matches
  // -------------------------------------------------------------------------
  for (const f of fixtures) {
    const homeLocal = apiIdToLocal.get(f.teams.home.id) ?? null
    const awayLocal = apiIdToLocal.get(f.teams.away.id) ?? null

    let stage: ReturnType<typeof mapStage>
    try {
      stage = mapStage(f.league.round)
    } catch (err) {
      report.errors.push(`fixture ${f.fixture.id}: ${(err as Error).message}`)
      report.matches_skipped += 1
      continue
    }
    const status = mapStatus(f.fixture.status.short)

    // group_letter só para fase de grupos — pega do time local resolvido (home primeiro, depois away)
    let groupLetter: string | null = null
    if (stage === 'group') {
      const resolvedTeamId = homeLocal ?? awayLocal
      if (resolvedTeamId) {
        const { data: tg } = await supabase
          .from('teams')
          .select('group_letter')
          .eq('id', resolvedTeamId)
          .maybeSingle()
        groupLetter = tg?.group_letter ?? null
      }
      if (!groupLetter) {
        report.errors.push(
          `fixture ${f.fixture.id}: group stage sem group_letter resolvido (home="${f.teams.home.name}", away="${f.teams.away.name}")`,
        )
        report.matches_skipped += 1
        continue
      }
    }

    const matchday = stage === 'group' ? parseMatchday(f.league.round) : null

    const row = {
      id: f.fixture.id,
      home_team_id: homeLocal,
      away_team_id: awayLocal,
      kickoff_at: f.fixture.date,
      stage,
      matchday,
      group_letter: groupLetter,
      status,
      home_score:
        status === 'finished' || status === 'live' ? f.goals.home : null,
      away_score:
        status === 'finished' || status === 'live' ? f.goals.away : null,
      home_score_extra: f.score.extratime.home,
      away_score_extra: f.score.extratime.away,
      home_score_penalties: f.score.penalty.home,
      away_score_penalties: f.score.penalty.away,
      elapsed_minutes: status === 'live' ? f.fixture.status.elapsed : null,
      live_status_short: status === 'live' ? f.fixture.status.short : null,
      venue: f.fixture.venue.name,
      venue_city: f.fixture.venue.city,
      last_synced_at: new Date().toISOString(),
    }

    const { error: upsertErr } = await supabase
      .from('matches')
      .upsert(row, { onConflict: 'id' })
    if (upsertErr) {
      report.errors.push(`upsert fixture ${f.fixture.id}: ${upsertErr.message}`)
      report.matches_skipped += 1
    } else {
      report.matches_upserted += 1
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

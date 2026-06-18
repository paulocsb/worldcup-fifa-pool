# Pipeline de Pontuação & Ranking

Como pontos das predictions são computados e expostos na tela `/ranking`.

> Doc operacional. Use pra diagnosticar problemas de ranking, debugar pontos
> errados, ou recuperar de falhas de cron.

---

## Arquitetura

```
sync-live (cron 1/min)
   │
   ├─ Lê fixtures de ontem+hoje UTC (range pra cobrir partidas que cruzam
   │  meia-noite UTC, ver supabase/functions/sync-live/index.ts)
   ├─ Safety net interno: matches com status='live' não vistos no range
   │  são buscados individualmente por ID
   ├─ Update em matches (placar, status, elapsed)
   │
   └─→ Se detecta transição live → finished:
        │
        └─→ fetch interno → compute-scores
             │
             ├─ Lê scoring_config
             ├─ Pra cada match finished pós-cutoff:
             │   ├─ Busca predictions
             │   └─ Upsert em scores
             │
             └─→ view user_total_scores agrega scores por usuário

Cliente:
   useRanking() → user_total_scores
   useRealtimeInvalidator listening on scores → invalida queries
```

Existe **TAMBÉM** um cron-safety-net `fifa-compute-scores-safety-net` que
dispara `compute-scores` toda **hora cheia**, independente do sync-live. Cobre
o caso onde sync-live perde a transição exatamente no minuto que rolou.

---

## Tabelas e views

| Objeto | Tipo | Pra que serve |
|---|---|---|
| `matches` | table | Estado dos jogos (status, score, elapsed) |
| `predictions` | table | Palpite por usuário+match (placar exato) |
| `group_predictions` | table | Palpite de ordem do grupo |
| `tournament_predictions` | table | Palpite de campeão/vice/3º |
| `scores` | table | Pontos computados (`source: 'match' \| 'group' \| 'tournament'`) |
| `user_total_scores` | view | Agregado por usuário (`sum(scores.points)`) |
| `scoring_config` | table | Tabela de pontos + cutoffs configuráveis |

---

## Edge Functions

| Função | Trigger | O que faz |
|---|---|---|
| `sync-live` | pg_cron 1/min | Atualiza placar/status; dispara compute-scores em transições |
| `compute-scores` | sync-live OU pg_cron 1/h | Upsert idempotente em scores pra matches finished |
| `sync-fixtures` | pg_cron 1/6h | Importa/atualiza fixtures futuros |
| `sync-match-detail` | client-triggered | Eventos/lineups/stats sob demanda |

---

## Cron Jobs

| Nome | Schedule | Função invocada |
|---|---|---|
| `fifa-sync-live` | `* * * * *` (toda hora) | sync-live |
| `fifa-sync-fixtures` | `5 */6 * * *` | sync-fixtures |
| `fifa-compute-scores-safety-net` | `0 * * * *` (toda hora cheia) | compute-scores (idempotente) |

Listar jobs ativos:

```sql
select jobname, schedule, active from cron.job order by jobname;
```

---

## Verificação: o ranking está em dia?

### 1. Detectar matches `finished` SEM `scores` correspondentes

⭐ **Query principal** — use quando o ranking parecer travado.

```sql
select
  m.id,
  m.matchday,
  m.home_score,
  m.away_score,
  m.last_synced_at,
  count(distinct p.user_id) as palpites,
  count(distinct s.user_id) as scores_gravados
from matches m
left join predictions p on p.match_id = m.id
left join scores s
  on s.match_id = m.id and s.source = 'match'
where m.status = 'finished'
  and (m.stage <> 'group' or coalesce(m.matchday, 1) >= 2)  -- respeita cutoff
group by m.id, m.matchday, m.home_score, m.away_score, m.last_synced_at
having count(distinct p.user_id) > 0
order by m.last_synced_at desc
limit 20;
```

Interpretação:
- `palpites = scores_gravados` → todo mundo pontuado ✅
- `palpites > scores_gravados` → algum usuário sem score (parcial)
- `scores_gravados = 0, palpites > 0` → compute-scores nunca rodou pra esse match ❌

### 2. Forçar recálculo global (idempotente)

Fix universal — roda quando a verificação (1) mostra inconsistência.

```sql
select public.invoke_edge_function('compute-scores');
```

Sem body = processa TODOS os matches finished. Idempotente — pode rodar quantas vezes quiser.

Ver o report:

```sql
select status_code, content::text
from net._http_response
where created > now() - interval '30 seconds'
order by created desc
limit 3;
```

Esperado: `200` + JSON `{ matches_evaluated, predictions_scored, total_points_awarded, errors: [] }`.

### 3. Sanity check do ranking atual

```sql
select
  uts.user_id,
  pr.display_name,
  uts.total_points,
  uts.last_computed
from user_total_scores uts
join profiles pr on pr.id = uts.user_id
order by uts.total_points desc
limit 10;
```

### 4. Últimas computações de score

```sql
select user_id, match_id, points, computed_at, breakdown
from scores
where source = 'match'
order by computed_at desc
limit 20;
```

`computed_at` antigo em matches finished recentes = sinal de que compute-scores não foi invocado ainda — verificação (1) detecta isso explicitamente.

### 5. Recomputar pontos de UM match específico

```sql
select public.invoke_edge_function(
  'compute-scores',
  jsonb_build_object('match_id', 1489385)
);
```

Útil quando: scoring_config mudou, ou suspeita de bug em uma partida específica.

### 6. Histórico de execuções de cron

```sql
select
  rd.start_time,
  rd.status,
  rd.return_message
from cron.job_run_details rd
join cron.job j on j.jobid = rd.jobid
where j.jobname in (
  'fifa-sync-live',
  'fifa-compute-scores-safety-net'
)
order by rd.start_time desc
limit 30;
```

`status = 'succeeded'` consecutivamente = saudável. `failed` recorrente = vault desconfigurado ou edge function quebrada.

---

## Como resgatar situações comuns

| Sintoma | Causa provável | Fix |
|---|---|---|
| Match `finished` mas sem `scores` | sync-live perdeu a transição OU fetch pra compute-scores falhou | Verificação (2) — recálculo global |
| Score errado pra um usuário | Predictions foram editadas após scoring rodar OU `scoring_config` mudou | Verificação (5) com `match_id` específico |
| Ranking atualizado no DB mas não no cliente | Realtime SSE caiu OU `staleTime` do TanStack Query | Hard refresh no PWA (Settings → Clear site data) |
| Cron `failed` recorrente | `vault.fifa.edge_url` aponta pra URL errada (ex: `host.docker.internal`) | Atualizar vault: `select vault.update_secret(id, '<URL_REAL>', name);` |
| Partida ao vivo travada (não atualiza) | sync-live com bug de date range OU API-Football down | Ver `docs/PLAN.md` debug section + invocar manual: `select public.invoke_edge_function('sync-live');` |

---

## Configuração de pontos

Editável em runtime via `scoring_config` (sem deploy):

```sql
select key, value from scoring_config order by key;
```

Após edição, **rodar recálculo global** (verificação 2) pra aplicar nas predictions já pontuadas.

---

## Arquivos-chave do repo

| Path | Responsabilidade |
|---|---|
| `supabase/functions/sync-live/index.ts` | Atualiza matches; dispara compute-scores em transições |
| `supabase/functions/compute-scores/index.ts` | Upsert idempotente em scores |
| `supabase/functions/_shared/scoring.ts` | Lógica de pontuação (server) |
| `src/lib/scoring.ts` | Lógica de pontuação (client, espelho do server) |
| `supabase/migrations/20260616000004_scheduling.sql` | Cron jobs sync-live + sync-fixtures + vault |
| `supabase/migrations/20260618000001_compute_scores_safety_net.sql` | Cron safety-net horária |
| `src/hooks/useRanking.ts` | Hook que lê `user_total_scores` no cliente |

---

## Princípios

1. **`compute-scores` é idempotente** — upsert por `(user_id, source, match_id, group_letter)`. Rodar 100x = mesmo resultado.
2. **`scores` é a verdade do servidor** — `src/lib/scoring.ts` no cliente é só preview. Em conflito, server vence.
3. **Cutoff é por matchday** — `scoring_config.group_matchday_start = 2` significa "MD1 não pontua".
4. **3 cron jobs trabalham juntos**: sync-live (ingest), compute-scores (cálculo on-finish), safety-net (rede de proteção horária).

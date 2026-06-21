# Scoring & Ranking Pipeline

How prediction points are computed and surfaced on the `/ranking` screen.

> Operational doc. Use it to diagnose ranking issues, debug wrong points,
> or recover from cron failures.

---

## Architecture

```
sync-live (cron 1/min)
   │
   ├─ Reads yesterday+today UTC fixtures (range covers matches crossing
   │  UTC midnight — see supabase/functions/sync-live/index.ts)
   ├─ Internal safety net: matches with status='live' missing from the range
   │  are fetched individually by ID
   ├─ Update matches (score, status, elapsed)
   │
   └─→ If a live → finished transition is detected:
        │
        └─→ internal fetch → compute-scores
             │
             ├─ Reads scoring_config
             ├─ For each finished match past the cutoff:
             │   ├─ Fetch predictions
             │   └─ Upsert into scores
             │
             └─→ user_total_scores view aggregates by user

Client:
   useRanking() → user_total_scores
   useRealtimeInvalidator listening on scores → invalidates queries
```

There is **also** a safety-net cron `fifa-compute-scores-safety-net` that
fires `compute-scores` **every hour** independently of sync-live. It covers
the case where sync-live misses the transition in the exact minute it
happened.

---

## Tables and views

| Object | Type | Purpose |
|---|---|---|
| `matches` | table | Match state (status, score, elapsed) |
| `predictions` | table | One prediction per user+match (exact score) |
| `group_predictions` | table | Group-ordering prediction |
| `tournament_predictions` | table | Champion/runner-up/3rd prediction |
| `scores` | table | Computed points (`source: 'match' \| 'group' \| 'tournament'`) |
| `user_total_scores` | view | Per-user aggregate (`sum(scores.points)`) |
| `scoring_config` | table | Configurable points + cutoffs |

---

## Edge Functions

| Function | Trigger | What it does |
|---|---|---|
| `sync-live` | pg_cron 1/min | Updates score/status; fires compute-scores on transitions |
| `compute-scores` | sync-live OR pg_cron 1/h | Idempotent upsert into scores for finished matches |
| `sync-fixtures` | pg_cron 1/6h | Imports/updates future fixtures |
| `sync-match-detail` | client-triggered | Events/lineups/stats on demand |

---

## Cron jobs

| Name | Schedule | Function invoked |
|---|---|---|
| `fifa-sync-live` | `* * * * *` (every minute) | sync-live |
| `fifa-sync-fixtures` | `5 */6 * * *` | sync-fixtures |
| `fifa-compute-scores-safety-net` | `0 * * * *` (every hour) | compute-scores (idempotent) |

List active jobs:

```sql
select jobname, schedule, active from cron.job order by jobname;
```

---

## Verification: is the ranking up to date?

### 1. Detect `finished` matches WITHOUT corresponding `scores`

⭐ **Primary query** — use when the ranking appears stuck.

```sql
select
  m.id,
  m.matchday,
  m.home_score,
  m.away_score,
  m.last_synced_at,
  count(distinct p.user_id) as palpites,
  count(distinct s.user_id) as scores_recorded
from matches m
left join predictions p on p.match_id = m.id
left join scores s
  on s.match_id = m.id and s.source = 'match'
where m.status = 'finished'
  and (m.stage <> 'group' or coalesce(m.matchday, 1) >= 2)  -- respect cutoff
group by m.id, m.matchday, m.home_score, m.away_score, m.last_synced_at
having count(distinct p.user_id) > 0
order by m.last_synced_at desc
limit 20;
```

Interpretation:
- `palpites = scores_recorded` → everyone scored ✅
- `palpites > scores_recorded` → some user missing a score (partial)
- `scores_recorded = 0, palpites > 0` → compute-scores never ran for this match ❌

### 2. Force global recompute (idempotent)

Universal fix — run when verification (1) shows inconsistency.

```sql
select public.invoke_edge_function('compute-scores');
```

No body = processes ALL finished matches. Idempotent — safe to run any number of times.

Check the report:

```sql
select status_code, content::text
from net._http_response
where created > now() - interval '30 seconds'
order by created desc
limit 3;
```

Expected: `200` + JSON `{ matches_evaluated, predictions_scored, total_points_awarded, errors: [] }`.

### 3. Current ranking sanity check

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

### 4. Latest score computations

```sql
select user_id, match_id, points, computed_at, breakdown
from scores
where source = 'match'
order by computed_at desc
limit 20;
```

A stale `computed_at` in recently finished matches = compute-scores hasn't been
invoked yet — verification (1) detects this explicitly.

### 5. Recompute points for ONE specific match

```sql
select public.invoke_edge_function(
  'compute-scores',
  jsonb_build_object('match_id', 1489385)
);
```

Useful when: scoring_config changed, or a specific match looks buggy.

### 6. Cron execution history

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

Consecutive `status = 'succeeded'` = healthy. Recurring `failed` = vault misconfigured or edge function broken.

---

## Recovery playbook (common situations)

| Symptom | Likely cause | Fix |
|---|---|---|
| `finished` match without `scores` | sync-live missed the transition OR fetch to compute-scores failed | Verification (2) — global recompute |
| Wrong score for a user | Predictions were edited after scoring ran OR `scoring_config` changed | Verification (5) with the specific `match_id` |
| Ranking updated in DB but not on the client | Realtime SSE dropped OR TanStack Query `staleTime` | Hard refresh the PWA (Settings → Clear site data) |
| Recurring `failed` cron | `vault.fifa.edge_url` points to a wrong URL (e.g., `host.docker.internal`) | Update vault: `select vault.update_secret(id, '<REAL_URL>', name);` |
| Live match stuck (not updating) | sync-live date-range bug OR API-Football down | See `docs/PLAN.md` debug section + manual invoke: `select public.invoke_edge_function('sync-live');` |

---

## Points configuration

Editable at runtime via `scoring_config` (no deploy):

```sql
select key, value from scoring_config order by key;
```

After editing, **run global recompute** (verification 2) to apply the changes
to already-scored predictions.

---

## Key files

| Path | Responsibility |
|---|---|
| `supabase/functions/sync-live/index.ts` | Updates matches; fires compute-scores on transitions |
| `supabase/functions/compute-scores/index.ts` | Idempotent upsert into scores |
| `supabase/functions/_shared/scoring.ts` | Scoring logic (server) |
| `src/lib/scoring.ts` | Scoring logic (client, mirror of the server) |
| `supabase/migrations/20260616000004_scheduling.sql` | Cron jobs sync-live + sync-fixtures + vault |
| `supabase/migrations/20260618000001_compute_scores_safety_net.sql` | Hourly safety-net cron |
| `src/hooks/useRanking.ts` | Client hook reading `user_total_scores` |

---

## Principles

1. **`compute-scores` is idempotent** — upserts on `(user_id, source, match_id, group_letter)`. Running it 100× = same result.
2. **`scores` is server truth** — `src/lib/scoring.ts` on the client is a preview. On conflict, the server wins.
3. **Cutoff is per matchday** — `scoring_config.group_matchday_start = 2` means "MD1 doesn't score".
4. **3 cron jobs work together**: sync-live (ingest), compute-scores (on-finish calc), safety-net (hourly protection).

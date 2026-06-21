---
name: scoring-verify
description: |
  Verify scoring in production. Runs the 6 queries from docs/SCORING.md in
  sequence, identifies finished matches without scores, recomputes if needed,
  and summarizes the scoring pipeline state. Use after deploying compute-scores,
  changing scoring_config, or when someone reports suspicious points.
---

# /scoring-verify — Scoring pipeline verification

Audit of scoring state in production. Covers the full path: finished matches →
did compute-scores run? → scores recorded? → did the ranking aggregate correctly?

## How to run

Provide the queries below in order. After each, interpret the result and
decide whether to proceed or take action.

## Queries (in order)

### 1. Finished matches WITHOUT corresponding scores (primary query)

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
left join scores s on s.match_id = m.id and s.source = 'match'
where m.status = 'finished'
  and (m.stage <> 'group' or coalesce(m.matchday, 1) >= 2)
group by m.id, m.matchday, m.home_score, m.away_score, m.last_synced_at
having count(distinct p.user_id) > 0
order by m.last_synced_at desc
limit 20;
```

**Interpretation**:
- `palpites = scores_recorded` → ✅ scored
- `palpites > scores_recorded` → ⚠️ partial (some users missing)
- `scores_recorded = 0` with `palpites > 0` → ❌ compute-scores never ran

If ⚠️ or ❌ appears → proceed to (2).

### 2. Force global recompute (idempotent, safe)

```sql
select public.invoke_edge_function('compute-scores');
```

No body = processes ALL finished matches.

See result:
```sql
select status_code, content::text
from net._http_response
where created > now() - interval '30 seconds'
order by created desc limit 3;
```

**Expected**: `200` + JSON `{ ok: true, matches_evaluated, predictions_scored, total_points_awarded, errors: [] }`.

Afterwards, RE-RUN query (1) — it should be clean.

### 3. Latest computations (timeline)

```sql
select user_id, match_id, points, breakdown, computed_at
from scores
where source = 'match'
order by computed_at desc
limit 20;
```

**Sanity check**: `computed_at` for recent matches should be close to now. Stale entries = compute-scores hasn't run for that match.

### 4. Breakdown of a suspicious match

If a user reported wrong scoring, isolate the match:

```sql
-- Replace MATCH_ID with the id in question
select s.user_id, p.display_name, s.points, s.breakdown,
       pr.home_score as predicted_home, pr.away_score as predicted_away,
       m.home_score as real_home, m.away_score as real_away
from scores s
join profiles p on p.id = s.user_id
join predictions pr on pr.user_id = s.user_id and pr.match_id = s.match_id
join matches m on m.id = s.match_id
where s.match_id = MATCH_ID and s.source = 'match';
```

Compare `breakdown` with the formula in `supabase/functions/_shared/scoring.ts`.

### 5. Point distribution by source

```sql
select source, count(*) as scores_count, sum(points) as total_points, avg(points)::numeric(5,2) as avg
from scores
group by source;
```

**Expected**: `match` source with many rows + low points per row; `group` and `tournament` with few rows + high points.

### 6. Final ranking

```sql
select uts.user_id, p.display_name, uts.total_points
from user_total_scores uts
join profiles p on p.id = uts.user_id
order by uts.total_points desc;
```

## Common scenarios and actions

| Symptom | Likely cause | Action |
|---|---|---|
| Query 1 shows matches without scores | sync-live missed the transition OR compute-scores failed | Query 2 (global recompute) |
| Query 1 clean but a user complains | Predictions edited after scoring ran | Recompute the specific match: `select public.invoke_edge_function('compute-scores', '{"match_id": MATCH_ID}'::jsonb);` |
| Wrong points for everyone in a match | Formula changed but no recompute | Query 2 |
| Score 0 on an MD1 match | Expected — the cutoff excludes MD1 (equity rule) | No action |

## Output

- **Language**: mirror the user (default pt-BR).
- **Structure**: per query, show a tabular result + interpretation + suggested action.
- **Final summary**: overall state (✅/⚠️/❌) + action list if any.

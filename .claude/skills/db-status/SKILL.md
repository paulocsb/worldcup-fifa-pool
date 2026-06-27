---
disable-model-invocation: true
name: db-status
description: |
  Health check the remote Supabase database. Runs 5 queries in sequence and
  summarizes: active cron jobs + last executions, current RLS policies, last
  match sync, ranking sanity check, and recently applied migrations.
  Use before schema/RLS changes, or to diagnose sync issues.
---

# /db-status — Supabase health check

Operational diagnostic of the production database. Useful for:
- Confirming pg_cron jobs are healthy
- Listing current RLS policies before a critical change
- Identifying stuck matches (in `live` for too long)
- Sanity-checking the ranking
- Seeing recently applied migrations

## How to run

Provide the user **the 5 queries below in sequence**, with a short explanation
for each. The user runs them in the **Supabase Dashboard → SQL Editor** and
pastes the result. For each result, interpret and flag:

- ✅ if healthy
- ⚠️ if attention required
- ❌ if a problem

## Queries

### 1. Active cron jobs
```sql
select jobname, schedule, active
from cron.job
order by jobname;
```
**Expected**: 3 active jobs — `fifa-sync-live` (every minute), `fifa-sync-fixtures` (every 6h), `fifa-compute-scores-safety-net` (every hour). All with `active = true`.

### 2. Latest cron executions (most recent 20)
```sql
select rd.start_time, j.jobname, rd.status, rd.return_message
from cron.job_run_details rd
join cron.job j on j.jobid = rd.jobid
where j.jobname in ('fifa-sync-live', 'fifa-sync-fixtures', 'fifa-compute-scores-safety-net')
order by rd.start_time desc
limit 20;
```
**Expected**: consecutive `status = 'succeeded'`. Recurring failures = vault misconfigured or edge function broken.

### 3. RLS policies in production
```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```
**Expected** (minimum): 3+ policies per sensitive table (predictions, group_predictions, tournament_predictions). Each must have "read after lock" and "insert/update own pre-lock".

### 4. Potentially stuck matches (live for more than 4h)
```sql
select id, status, kickoff_at, last_synced_at,
       ht.code as home, at.code as away
from matches m
left join teams ht on ht.id = m.home_team_id
left join teams at on at.id = m.away_team_id
where m.status = 'live'
  and m.kickoff_at < now() - interval '4 hours'
order by m.kickoff_at desc;
```
**Expected**: empty. If anything appears, sync-live missed the transition → the safety-net should pick it up. Worth running manually: `select public.invoke_edge_function('sync-live');`

### 5. Ranking sanity check
```sql
select uts.user_id, p.display_name, uts.total_points
from user_total_scores uts
join profiles p on p.id = uts.user_id
order by uts.total_points desc
limit 10;
```
**Expected**: top 10 with consistent points. A spike of zeros = compute-scores hasn't run.

## Final summary

After the 5 queries, give the user a concise summary:

```
✅ Cron jobs: 3 active, no failures in the last 20 executions
✅ RLS: 9 policies across 3 critical tables
⚠️ 1 stuck match (GHA × PAN, id 1489385) — suggest running sync-live manually
✅ Ranking: 8 users with coherent points
```

## Output

- **Language**: mirror the user (default pt-BR).
- **Style**: markdown tables summarizing each query's result, NOT raw JSON.
- **End with** 1 health summary + suggested actions (if any).

---
name: deploy-fn
description: |
  Deploy a Supabase edge function + post-deploy smoke test. Runs
  `supabase functions deploy <name>`, then invokes the function with a test
  payload and reports the result. Use after changes in supabase/functions/*.
---

# /deploy-fn — Deploy + smoke test an edge function

Shortcut to publish an edge function and immediately validate it's up.

## How to run

Expects the function name as argument. Available functions:
- `sync-live`
- `sync-fixtures`
- `compute-scores`
- `sync-match-detail`

### Step 1: confirm git status

Before deploying, ensure changes are committed (good practice — deploying
uncommitted code creates divergence).

```bash
git status --short supabase/functions/<name>/
```

If there are `M` or `??` files, ask whether to deploy uncommitted. Default:
warn and let the user decide.

### Step 2: deploy

```bash
supabase functions deploy <name>
```

Expected: log with "Deployed Function: <name>" + URL. On failure (auth/config),
report the error and stop.

### Step 3: smoke test (varies by function)

| Function | Test payload | Expected in result |
|---|---|---|
| `sync-live` | `{}` (no body — uses yesterday+today UTC range) | `{ ok: true, fixtures_returned: N, matches_updated: N, errors: [] }` |
| `sync-fixtures` | `{}` | `{ ok: true, fixtures_imported_or_updated: N, errors: [] }` |
| `compute-scores` | `{}` (recomputes everything idempotently) | `{ ok: true, matches_evaluated: N, predictions_scored: N, errors: [] }` |
| `sync-match-detail` | `{"match_id": <id>}` (pick a known finished one) | `{ ok: true, events_count, lineups_count, statistics_count }` |

Invocation via SQL editor:
```sql
select public.invoke_edge_function('<name>', '<json>'::jsonb);
```

Then result:
```sql
select status_code, content::text
from net._http_response
where created > now() - interval '30 seconds'
order by created desc limit 1;
```

### Step 4: interpretation

- `status_code = 200` + `ok: true` → ✅ deploy OK
- `status_code = 207` (multi-status) → ⚠️ ran but with `errors` — list and investigate
- `status_code 4xx/5xx` → ❌ failed — pull logs:
  ```bash
  supabase functions logs <name> --limit 50
  ```

## Output

- **Language**: mirror the user (default pt-BR).
- **Structure**: 3 sections (Deploy, Smoke, Interpretation) with ✅/⚠️/❌ at the top of each.
- **End with** instructions on what to check manually, if applicable (e.g., "open `/matches` and confirm GHA × PAN appears as finished").

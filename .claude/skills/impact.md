---
name: impact
description: |
  Maps the side effects of a proposed change BEFORE implementing it. Identifies:
  affected files, RLS implications, scoring ripple, UI breakage, tests/queries
  to run, and blast radius. Use before non-trivial changes (migrations, schema,
  scoring rules, refactors > 2 files).
---

# /impact — Blast-radius map

Static analysis of a PROPOSED change (not yet implemented). Output: blast-radius
map + verification checklist. Forces thinking before coordinating destruction.

## How to run

Expects a description of the proposed change as input. Examples:
- "I'll switch the cutoff from MD1 to MD2"
- "Rename `kickoff_at` column to `starts_at`"
- "Add new score source: 'best of week'"
- "Refactor useMatches to be paginated"

## Dimensions to evaluate

For each, DO NOT assume — investigate via Read/Grep BEFORE asserting.

### 1. Affected files
- Which files need to change directly?
- Which files consume this entity and need to adapt?
- Grep by name/symbol to find all consumers.

### 2. DB schema & RLS
- Touches a table? New migration required?
- Row shape changed → types in `src/types/db.ts` need regenerating?
- Does an RLS policy reference the changed column/table?
- Do helpers (`match_predictions_open`, `group_predictions_open`, `tournament_predictions_open`) need updating?

### 3. Scoring ripple
- Changed a scoring rule → updated BOTH `src/lib/scoring.ts` AND `supabase/functions/_shared/scoring.ts`?
- Does `scoring_config` need a new key or different value?
- Existing scores go stale → recompute needed?
- Ranking changes → user expectations change too?

### 4. Edge functions
- Touches an endpoint a cron job invokes? (`sync-live`, `sync-fixtures`, `compute-scores`, `sync-match-detail`)
- Payload/response shape changed → consumers (client + other functions) know about it?
- Needs redeploy via `supabase functions deploy <name>`?

### 5. UI breakage
- Components that render this entity?
- Affected routes (list, detail)?
- Realtime queries (`useRealtimeInvalidator`) consuming this table?
- Mobile UX impact? (run `/mobile-audit` afterwards)

### 6. Auth / permissions
- Operation gated by RLS? Who can/can't read or write now?
- Prediction lock affected?
- Session / refresh token impacted?

### 7. Tests / verifications to run
- SQL queries to validate pre/post change state.
- Suggested manual smoke test.
- `pnpm typecheck && pnpm build` mandatory.
- `/scoring-verify` if scoring was touched.
- `/db-status` if the database was touched.

### 8. Rollback plan
- How to revert if things go bad?
- Does the migration have a `down`? (Supabase doesn't always require it, but worth planning.)
- Edge function can be reverted (`supabase functions deploy` previous version).
- Client change: revert the commit + Cloudflare rebuild.

## Output format

```
# Impact: <short change title>

## Summary
1 paragraph describing what changes and why.

## Blast radius
- 🔴 Critical: items that BREAK if ignored.
- 🟡 Medium: items that need updating for consistency.
- 🟢 Low: nice-to-have, consider but not blocking.

## Files to touch
| Path | Expected change | Risk |
|---|---|---|
| supabase/migrations/YYYYMMDDXX_*.sql | new migration | 🔴 |
| src/types/db.ts | regenerate types | 🟡 |
| src/hooks/useFoo.ts | adapt query | 🟢 |

## Verifications
- [ ] pnpm typecheck && pnpm build
- [ ] Pre-change SQL query: `select ...`
- [ ] Post-change SQL query (validation): `select ...`
- [ ] /scoring-verify if applicable
- [ ] /mobile-audit if UI

## Rollback
Short procedure to undo.

## Recommendation
Go / wait / rethink? If go, in how many steps (sprints)?
```

## Principles

- **Doesn't estimate time effort** — only categorizes risk and enumerates touchpoints.
- **Doesn't implement anything** — only maps. Implementation comes after approval.
- **Honest about uncertainty** — if it couldn't find a consumer, says so.
- **Always suggests verification queries** when applicable.

## Output

- **Language**: mirror the user (default pt-BR).
- **Tone**: structured, concise. No excessive hedging.
- **End with** a clear recommendation (go / wait / rethink).

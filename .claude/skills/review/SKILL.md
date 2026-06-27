---
name: review
description: |
  Self-review of the current diff through 4 lenses — Correctness, Security,
  Performance, Maintainability. Used by /ship and callable standalone before
  asking a human reviewer to look. Outputs file-level findings with 🔴/🟡/🟢
  severity and specific suggestions.
---

# /review — 4-lens self-critique

Take the current diff (working tree + staged + commits ahead of main, as
appropriate) and review it as if you were a senior reviewer asked for a
candid second opinion. The goal is to surface what a tired author would
miss — not to nitpick.

## Scope

Default: `git diff main..HEAD` plus uncommitted changes.

If user passes a file or path, scope to that.

## The 4 lenses

For each file in the diff, evaluate against ALL four. Skip lenses that
genuinely don't apply (e.g., performance on a docs change).

### 1. Correctness 🐛

Bugs hiding in the diff. Be specific:

- Null / undefined handling missed
- Edge cases (0, empty array, max int, negative, NaN)
- Off-by-one
- Race conditions / stale closures
- Promise/async error paths not handled
- Type assertions hiding real issues (`as any`, `!`)
- Inverted conditions
- Wrong dependency in `useEffect` / `useMemo`
- Pure-function purity broken (mutations, side effects)

### 2. Security 🔒

- Hardcoded secrets in the diff (service role, API keys, passwords)
- RLS coverage: new table without policies? new column accessible to wrong role?
- Auth boundary: client doing what should be server-only?
- Input validation missing at boundaries (Zod, manual)
- SQL injection (rare in Supabase via client, but watch raw queries)
- Open redirects / XSS in markdown rendering
- Exposed PII or invite codes in logs/errors

### 3. Performance ⚡

- N+1 query patterns (loop over array with awaited call)
- Polling instead of Realtime
- Missing memoization where profiling would care (stable refs to memoized children)
- Bundle size impact (large dep, no code splitting)
- Render churn (state derivation in render that could be useMemo)
- Synchronous expensive computations on main thread

### 4. Maintainability 🧹

- Naming clarity (variables, functions, files)
- Complexity hot spots (functions > 50 lines, nesting > 4)
- Duplicated logic that should be extracted
- Missing comments on non-obvious WHY (not what — what is obvious from code)
- Tests missing for new logic
- Dead code introduced
- Inconsistency with project conventions (CLAUDE.md, AGENTS.md)

## Severity

| Symbol | Meaning |
|---|---|
| 🔴 | Block: real bug, security risk, or convention violation that will burn |
| 🟡 | Concern: works but should be addressed before review (or merge if reviewer agrees) |
| 🟢 | Nit: subjective, take it or leave it |

## Output format

Per file, only show lenses that have findings:

```markdown
### src/hooks/useMatches.ts

**Correctness 🐛**
- 🔴 Line 23: `data!` masks a potential `null` from `.maybeSingle()`. If the
  match is deleted, this crashes downstream. Use `data?.…` and bail early.

**Performance ⚡**
- 🟡 Line 17: refetches all 104 matches on every realtime event. Consider
  `useRealtimeInvalidator` with a more granular key.

### src/components/MatchCard.tsx

**Maintainability 🧹**
- 🟢 Line 56: extract the conditional class block into a constant — used in 3 places.
```

If no findings: print `✅ No findings.`.

## Summary at the end

```
🔴 N critical
🟡 M concerns
🟢 P nits

Recommendation: <one of>
- Merge after addressing critical
- Ready to merge
- Refactor needed before merge
```

## Anti-patterns to avoid in YOUR review

- ❌ Listing things "for completeness" that don't matter — wastes the user's attention
- ❌ Style nitpicks (semicolons, single vs double quotes — Prettier handles this)
- ❌ "Consider adding more tests" without saying what to test
- ❌ Mentioning the same issue at multiple files when it's a pattern
- ❌ Reviewing for things the lens doesn't cover (correctness lens shouldn't critique style)

## Honesty

Better to surface a 🔴 wrongly than miss it. Better to say "I'm not sure
this is a bug, but..." than to skip it.

If you don't see anything in the diff that warrants concern, say so plainly.

## Output language

Mirror the user. Default pt-BR for the summary and recommendations; the
file-level findings can stay terse with English code refs (`file:line`).

---
name: ship
description: |
  Pre-flight quality gate before opening a PR. Runs typecheck, build, tests,
  conditional audits (mobile, scoring), self-review, secrets scan, and i18n
  check. Outputs a verdict (GO / WAIT / BLOCK) plus a PR body draft if GO.
  This is the final checkpoint between local work and asking a human to review.
---

# /ship — Pre-PR quality gate

Run the full quality pyramid. Each check is independent (or has a clear
gating order). Surface results in real-time; produce a final verdict.

## The 10 checks

### 1. Type check (mandatory)

```bash
pnpm typecheck
```

- exit 0 → ✅
- exit ≠ 0 → 🔴 BLOCK, show errors, stop here

### 2. Lint (mandatory)

```bash
pnpm lint
```

- exit 0, no errors → ✅ (warnings → ⚠️ note the count, don't block)
- any errors → 🔴 BLOCK, show them

### 3. Build (mandatory)

```bash
pnpm build
```

- exit 0 → ✅; compute bundle delta if possible (`du -k dist/`)
- exit ≠ 0 → 🔴 BLOCK

### 4. Tests (mandatory if test suite exists)

```bash
pnpm test
```

- all green → ✅
- any failures → 🔴 BLOCK
- no tests in repo → ⚠️ note "no tests"

### 5. Mobile audit (conditional)

Trigger: any changed file matches `src/components/**` or `src/routes/**`.

```bash
git diff main..HEAD --name-only | grep -E '^src/(components|routes)/'
```

If non-empty → invoke `/mobile-audit` internally and surface result.
- 0 blockers → ✅
- blockers → 🔴

### 6. Scoring verify (conditional)

Trigger: any changed file matches `src/lib/scoring.ts` or
`supabase/functions/_shared/scoring.ts` or `supabase/functions/compute-scores/`.

If triggered → invoke `/scoring-verify`. User runs the SQL queries.
- queries clean → ✅
- mismatches → 🟡 WAIT, present recompute steps

### 7. Impact recap (informational)

Invoke `/impact` summarized — list the blast radius of this PR. Always
shown, never blocks (it's situational awareness for the reviewer).

### 8. Self-review (mandatory)

Invoke `/review` (4-lens). Surface findings by severity.

- 0 🔴 → ✅
- any 🔴 → 🔴 BLOCK
- 🟡 → ⚠️ WAIT (user can override)

### 9. Secrets scan (mandatory)

```bash
git diff main..HEAD | grep -E '(SUPABASE_SERVICE_ROLE_KEY|sk_live_|API_FOOTBALL_KEY[^_])'
```

Also check that no `.env*` (other than `.env.example`) is in the diff.

- empty match → ✅
- any match → 🔴 BLOCK, surface offending file

### 10. Hardcoded English strings audit (mandatory)

Trigger: changes in `src/**/*.tsx`.

Look for likely English UI strings (heuristic — false positives OK, just
flag for human review). Examples to flag:
```bash
git diff main..HEAD -- 'src/**/*.tsx' | grep -E ">[A-Z][a-z]+ ([A-Z][a-z]+|[a-z]+)<"
```

Until i18n lands, the UI is pt-BR. If matches found → 🟡 WAIT.

## Final verdict

| Verdict | Condition | What to do |
|---|---|---|
| 🟢 **GO** | All 10 ✅ (or skipped n/a) | Produce PR body draft |
| 🟡 **WAIT** | 1+ ⚠️ but 0 🔴 | List warnings, ask user to confirm or address |
| 🔴 **BLOCK** | Any 🔴 | List blockers — fix and re-run |

## On GO — produce PR body

Use `.github/pull_request_template.md` as the scaffold:

```markdown
## Summary

<2-3 bullets — extract from commit messages or spec>

## Linked issues

<from branch name or recent context>

## Specialized agent used

- [x] <which ones — derived from /impact and the files touched>

## Verification

- [x] pnpm typecheck passes
- [x] pnpm lint passes (0 errors)
- [x] pnpm build succeeds (gzip <+X KB or "no change">)
- [x] pnpm test green (<N tests>)
- [x] /mobile-audit ran (if UI)
- [x] /scoring-verify ran (if scoring)
- [x] No secrets in diff
- [x] No hardcoded English UI strings

## Notes for reviewer

<from /review output — anything they should look closely at>
```

End with the exact command to open the PR:

```bash
gh pr create --title "<derived title>" --body-file -
```

## Output structure (always)

```
Pre-flight check: <verdict>

1.  Type check       ✅
2.  Lint             ✅ (0 errors, 3 warnings)
3.  Build            ✅ (gzip <size>)
4.  Tests            ✅ (11 passed)
5.  Mobile audit     n/a (no UI changes)
6.  Scoring verify   n/a (no scoring changes)
7.  Impact           ℹ️ Touches src/hooks/useMatches.ts + 1 component
8.  Self-review      ✅ 0 critical findings
9.  Secrets scan     ✅
10. i18n / pt-BR     ✅

[If GO] PR body draft below ↓
[If WAIT] Warnings:
- <item 1>
- <item 2>
[If BLOCK] Blockers:
- <item 1>
```

## Output language

Mirror the user. Default pt-BR for explanations; verdicts and labels keep
their visual symbols.

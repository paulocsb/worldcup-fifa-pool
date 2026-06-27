---
name: verify
description: |
  Quality gate — fast subset of /ship. Runs typecheck, build, tests, and
  conditional audits (mobile if UI changed, scoring if scoring changed).
  Skips self-review, secrets scan, and PR body generation. Use for rapid
  pre-commit confidence or as the gate inside /feature workflows.
---

# /verify — Rapid quality gate

A focused subset of `/ship`. Designed to run frequently during
development without waiting on the full self-review pass.

## The 6 checks

### 1. Type check

```bash
pnpm typecheck
```

- exit 0 → ✅
- exit ≠ 0 → 🔴 BLOCK, show errors

### 2. Lint

```bash
pnpm lint
```

- exit 0, no errors → ✅ (warnings → ⚠️ note the count, don't block)
- any errors → 🔴 BLOCK, show them

### 3. Build

```bash
pnpm build
```

- exit 0 → ✅
- exit ≠ 0 → 🔴 BLOCK

### 4. Tests

```bash
pnpm test
```

- all green → ✅
- failures → 🔴 BLOCK
- no test suite (yet) → ⚠️ note "no tests"

### 5. Mobile audit (conditional)

Trigger: any changed file matches `src/components/**` or `src/routes/**`.

If triggered → invoke `/mobile-audit`. Surface result.

### 6. Scoring verify (conditional)

Trigger: changes touched scoring files.

If triggered → invoke `/scoring-verify`. User runs the queries.

## Output format

```
Verify: <verdict>

1. Typecheck       ✅
2. Lint            ✅ (0 errors, 3 warnings)
3. Build           ✅
4. Tests           ✅ 11 passed
5. Mobile audit    ✅ (3 files audited, 0 blockers)
6. Scoring verify  n/a

→ Safe to commit.
```

Verdict:
- 🟢 GO: all ✅ or n/a → safe to commit
- 🔴 BLOCK: any 🔴 → fix before continuing

## Difference from /ship

| Check | /verify | /ship |
|---|---|---|
| typecheck | ✅ | ✅ |
| lint | ✅ | ✅ |
| build | ✅ | ✅ |
| tests | ✅ | ✅ |
| mobile-audit | ✅ (conditional) | ✅ (conditional) |
| scoring-verify | ✅ (conditional) | ✅ (conditional) |
| impact recap | ❌ | ✅ |
| 4-lens review | ❌ | ✅ |
| secrets scan | ❌ | ✅ |
| i18n audit | ❌ | ✅ |
| PR body draft | ❌ | ✅ on GO |

Use `/verify` mid-development. Use `/ship` right before opening the PR.

## Output language

Mirror the user. Default pt-BR for explanations; the structured output
keeps its symbols.

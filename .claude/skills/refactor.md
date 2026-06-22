---
name: refactor
description: |
  Guided refactor of a code area without changing behavior. Identifies safe
  operations (rename, extract, inline, move), proposes minimal-blast-radius
  steps, and verifies behavior preservation after each step via typecheck +
  tests. Use when code smells need addressing but the feature still works.
---

# /refactor \<area\> — Behavior-preserving refactor

The user wants to clean up some area of the code. The contract is
**no behavior changes** — only structure. If the diff changes
externally observable behavior, it's a feature, not a refactor (use
`/feature` instead).

## Step 0 — Read the area

Before proposing anything, read the target files thoroughly. Understand
their consumers via grep:

```bash
grep -rn "<symbol>" src/ supabase/ docs/
```

Don't refactor what you don't understand.

## Step 1 — Identify safe operations

Refactors that preserve behavior fall into these categories:

| Op | Example | Risk |
|---|---|---|
| **Rename symbol** | Variable, function, file | Low if grep-clean |
| **Extract function** | Inline expression → named function | Low |
| **Inline function** | Single-use trivial wrapper → call site | Low |
| **Move file** | Reorganize folders | Low (update imports) |
| **Extract component** | JSX block → component | Medium (props inference) |
| **Replace literal with constant** | Magic number → named const | Low |
| **Simplify conditional** | Nested if → early return | Low |
| **Replace data structure** | Array of objects → Map | Medium (consumers) |
| **Remove dead code** | Unused exports, unused branches | Low if confident |

Avoid (these are NOT pure refactors — surface them and ask):
- ❌ Changing data shape that crosses a network boundary
- ❌ Changing RLS or migration semantics
- ❌ Changing scoring formula
- ❌ Adding new dependencies
- ❌ Replacing one library with another

## Step 2 — Propose the plan

List the steps in order, smallest first:

```
1. Rename `useMyScores` → `useMyScoresByMatch` (clearer intent)
2. Extract `groupedByPhase` reducer into a top-level function
3. Move `groupedByPhase` to `src/lib/groupBy.ts` if reused
4. Inline `formatPredictionLabel` (single-use wrapper)
```

Each step should be a separate commit conceptually.

## Step 3 — Execute one step at a time

For each step:

1. Apply the edit
2. Run `pnpm typecheck` → must pass
3. Run `pnpm test` → must pass
4. If non-trivial, run `pnpm build`
5. Confirm to user: "Step N done, verified."

If any step fails the verification, STOP. Don't pile up changes — revert
the failing step (`git checkout -- <file>`) and reconsider.

## Step 4 — Final verification

After all steps:

```bash
pnpm typecheck && pnpm test && pnpm build
```

Run `git diff main..HEAD --stat`. Summarize:

- N steps applied
- M files changed
- ±X lines

## Honest signals you're NOT doing a refactor

If during the work you notice yourself:

- Changing the return type of an exported function
- Adding a new prop
- Changing query parameters
- Adding state to a component
- Modifying CSS that wasn't a code-organization change
- Touching a migration

→ **Stop**. This is feature work disguised. Open a `/feature` flow or
explicitly mark the refactor as "behavior change included" and confirm
with the user.

## Output

Final summary:

```
Refactor complete: <area>

Steps applied:
1. ✅ <step 1>
2. ✅ <step 2>
3. ✅ <step 3>

Verification:
- pnpm typecheck ✅
- pnpm test ✅ (N tests)
- pnpm build ✅

Files changed: M
Net lines: -X / +Y
Behavior changes: none (verified)
```

## Output language

Mirror the user. Default pt-BR.

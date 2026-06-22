---
name: bug
description: |
  Investigation playbook for fixing a bug. Walks through 5 phases: reproduce
  → isolate → root cause → propose fix → validate. Forces concrete reasoning
  with code reads, log inspection, and git blame instead of pattern-matching
  guesses. Use for any non-trivial defect.
---

# /bug \<description\> — Bug investigation playbook

The user reported a bug. Avoid the temptation to immediately propose a
fix. Walk through 5 phases. Each phase is a step in the funnel from
"something is wrong" to "exact line + provable fix".

## Phase 1 — Reproduce

You must be able to describe the failure with **concrete inputs and
outputs**. Vague reports become precise here.

Ask the user (if not already in the bug description):
- What did you do? (exact steps)
- What did you expect?
- What happened instead?
- Browser / device?
- Logs you saw (if any)?

If the user shared a screenshot, examine it. If they shared a URL, fetch it.

Output of this phase: a 3-line repro:
```
1. Open /matches
2. Tap a finished match
3. Expected: see score. Actual: see "vs"
```

## Phase 2 — Isolate

Which layer owns the bug? Narrow it down with reads:

| Hypothesis | How to test |
|---|---|
| UI rendering | Read the component, check conditionals |
| Hook / state | Read the hook, check query state in DevTools (or instrument with `console.log` if user can re-run) |
| Network response | `supabase functions logs <fn>` or browser Network tab |
| RLS policy | Run the query as anon role in SQL editor |
| Edge function logic | Read the function source |
| Scoring math | Check `src/lib/scoring.ts` + server `_shared/scoring.ts` |
| Migration / schema | Compare `supabase/migrations/` with what's in production |

Pick the most likely 2-3 hypotheses. Investigate each with a concrete
command. **Don't guess** — read code, read logs, run queries.

Use the right specialized agent's lens:
- UI bug → frontend agent's mental model
- DB / RLS / edge function → supabase agent's mental model
- Scoring / ranking → scoring agent's mental model

## Phase 3 — Root cause

You now have evidence pointing at a specific file/line/condition. State
it clearly:

> "Root cause: `src/components/MatchCard.tsx:74` — `showScore` checks
> `status === 'finished' || status === 'live'`, but the screenshot
> shows `status='cancelled'` which the API returns when a match is
> postponed. The current code falls through to the 'vs' branch."

Run `git blame` on the suspect line to understand when/why the code is
the way it is. The original author had a reason; respect it before
changing it:

```bash
git log -L <start>,<end>:<file> | head -30
```

## Phase 4 — Propose fix

Smallest possible change that fixes the root cause. Avoid:
- Refactors smuggled into bugfixes
- Adding flags / config to "make it work in this edge case"
- Touching files unrelated to the root cause

State the fix in words first, then code:

> Fix: extend `showScore` to also treat `'cancelled'` as a non-vs state
> if `home_score` is non-null. One-line change.

## Phase 5 — Validate

Before declaring done:

- [ ] The fix actually addresses the root cause (re-run the repro mentally)
- [ ] `pnpm typecheck && pnpm build` clean
- [ ] If logic is non-trivial: add a regression test to
      `src/lib/<file>.test.ts` (or create a new test file)
- [ ] Side effects checked: did the fix break anything that depended on
      the old behavior?
- [ ] If applicable, run `/verify` for the full quality gate

## Output

Produce a structured report:

```markdown
**Repro**: <3-line repro>
**Root cause**: <file:line + 1-paragraph explanation>
**Fix**: <description + diff or file:line edits>
**Regression test**: <test added, or "n/a — manual smoke only">
**Side effects checked**: <yes — explain / not applicable>
```

## Anti-patterns to avoid

- ❌ Proposing a fix in phase 1 before isolating
- ❌ "Try this and see" without reading the code
- ❌ Adding catch blocks to silence errors
- ❌ Adding feature flags / fallbacks instead of fixing the bug
- ❌ Touching > 2 files for a bug fix (smell of refactor disguised)
- ❌ Skipping the regression test when the bug was logic, not config

## Output language

Mirror the user. Default pt-BR. Code references use `file:line` format.

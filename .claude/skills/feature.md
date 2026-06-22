---
name: feature
description: |
  End-to-end pipeline for adding a new feature. Drives 6 phases with human
  checkpoints between each: Spec → Impact → Plan → Implement → Verify →
  PR-ready. Composes the right specialized agents per phase and parallelizes
  multi-domain work. Use this for non-trivial features (>2 files, schema, UX).
---

# /feature \<description\> — End-to-end feature pipeline

The user described a feature they want. Drive it from idea to PR-ready
through 6 phases. **Stop at each checkpoint** and wait for explicit
approval before moving to the next.

## Phase 1 — Spec

Invoke `/spec` internally to write a structured spec. Save to
`docs/specs/YYYY-MM-DD-<slug>.md`.

The spec is the source of truth for acceptance criteria. Don't skip
this even if the feature feels small — writing it forces clarity.

**Checkpoint**: show the spec draft. Ask:

> "Spec drafted at `docs/specs/<file>`. Want to edit anything,
> or 'go' to proceed to impact analysis?"

Wait for explicit "go" / edits.

## Phase 2 — Impact analysis

Invoke `/impact` with the spec as input. It maps blast-radius:
- Files affected
- DB schema / RLS implications
- Scoring ripple (if any)
- Edge functions touched
- UI breakage surface
- Auth / permissions implications
- Verification queries needed
- Rollback plan

**Checkpoint**:

> "Impact mapped. Highlights: <top 2-3 risks>. Proceed to planning?"

Wait for "go".

## Phase 3 — Plan

Generate a structured implementation plan. Use `TaskCreate` to track:
- One task per logical step
- Each task tagged with the specialized agent that should own it
  (`frontend`, `supabase`, `scoring`, or `multi`)
- Risk level per step
- Dependencies (what blocks what)

Examples:
```
- [supabase] Add migration: new column matches.matchday → low risk
- [supabase] Update RLS policy if accessing this column post-lock → medium
- [frontend] Update useMatches hook to expose matchday → low
- [frontend] Update MatchCard to show matchday badge → low
```

**Checkpoint**:

> "Plan is N steps across <list of agents>. Approve?"

## Phase 4 — Implement

For each step in the plan, invoke the matching specialized agent.

**Parallelize** independent steps. Example: if the plan has both a
migration (supabase) and a new component (frontend) that don't depend
on each other, dispatch them in parallel using multiple `Agent` tool
calls in one message.

Mark tasks as `in_progress` when started, `completed` when done. The
agent suite's typecheck hook auto-runs at session end, but during
implementation, run `pnpm typecheck` manually after non-trivial
multi-file changes.

If a sub-agent surfaces scope creep, **stop and resurface to the user**
— don't silently expand scope. The spec was the contract.

After all tasks complete:

```bash
git diff --stat main..HEAD
```

Brief summary to user: "Implemented N steps across M files. Ready for
verification."

## Phase 5 — Verify

Invoke `/verify`. Must pass cleanly before moving to phase 6.

If `/verify` flags issues, fix them and re-run.

## Phase 6 — PR ready

Generate a PR body following `.github/pull_request_template.md`:

```markdown
## Summary

<2-3 bullets describing what changed>

## Linked issues

Closes #N (or "Refs spec at docs/specs/...")

## Specialized agent used

- [x] frontend / supabase / scoring (whichever applied)

## Verification

- [x] pnpm typecheck passes
- [x] pnpm build succeeds
- [x] pnpm test green (if logic changed)
- [x] /mobile-audit ran (if UI)
- [x] /scoring-verify ran (if scoring)
- [x] No secrets in diff

## Notes for reviewer

<anything specific>
```

Update the spec's `Status:` to `implemented`.

Print the PR body to the user (ready to paste). Suggest:

```bash
gh pr create --title "..." --body-file -
```

## Notes

- Mirror the user's language at each checkpoint.
- Be honest about uncertainty. If a phase reveals the feature is bigger
  than expected, **stop and surface it** — don't proceed.
- Use `TaskCreate/TaskUpdate` throughout for visibility.
- If the user wants to skip a phase (e.g., "skip spec, just plan it"),
  warn them once about the trade-off, then respect their choice.

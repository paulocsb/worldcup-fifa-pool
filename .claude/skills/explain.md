---
name: explain
description: |
  Produces a one-pager explaining a specific area of the codebase, calibrated
  for a contributor who has never seen it. Includes where to start reading,
  key concepts, common gotchas (with code references), and which specialized
  agent to use for changes. Useful for onboarding and self-education.
---

# /explain \<topic\> — One-pager for a contributor

A new contributor (human or AI) wants to understand an area of this codebase
without reading everything. Produce a calibrated one-pager.

## Topic scope

Topic can be:
- A feature ("predictions", "ranking", "live sync")
- A subsystem ("scoring", "auth", "PWA")
- A file or directory ("src/hooks", "supabase/functions/sync-live")
- A concept ("RLS in this repo", "the dual scoring system", "lock semantics")

If the topic is ambiguous, ask one clarifying question, then proceed.

## Structure (one-pager)

Target length: ~400 lines max. Use these sections:

### What is this?

1 paragraph (max 5 lines). Plain English. What this thing IS, what it
DOES, why it EXISTS.

### Where to start reading

3 files in reading order. For each, ~1 sentence on why.

```
1. `src/hooks/useRanking.ts` — entry point: the query the UI runs
2. `supabase/migrations/20260615000001_init.sql` — the `user_total_scores`
   view definition (lines 193–202)
3. `supabase/functions/compute-scores/index.ts` — what populates the
   underlying `scores` table
```

### Key concepts

3–5 bullets max. Each bullet:
- Names a concept
- Anchors it in the code (file:line)
- States the rule plainly

```
- **Dual implementation**: client preview (`src/lib/scoring.ts`) mirrors
  server truth (`supabase/functions/_shared/scoring.ts`). Keep in sync.
- **Idempotent compute**: scores are upserted on `(user_id, source,
  match_id, group_letter)`. Re-running compute-scores is safe.
- **Cutoff rule**: matches in group stage with `matchday < group_matchday_start`
  (default 2) don't score. This is the equity rule for shipping mid-Cup.
```

### Common gotchas

Anti-patterns we've hit in this area. Each gotcha:
- Names the trap
- States what NOT to do
- Says what to do instead

```
- ❌ Hardcoding point values in the client → ✅ read from `useScoringConfig()`
- ❌ Polling the ranking endpoint → ✅ use `useRealtimeInvalidator` on `scores`
- ❌ Changing the formula in only one of the two scoring files → ✅ touch both,
  then recompute via `/scoring-verify`
```

### Which agent / skills for changes

Map the topic to the agent suite:

```
For changes here:
- Specialized agent: `scoring`
- Useful skills: `/scoring-verify` (after any change), `/impact` (before)
- Related docs: docs/SCORING.md, docs/PLAN.md §"Scoring rules"
```

### Glossary (optional)

Only if the topic has domain terms. Skip otherwise.

```
- **MD** — Matchday. 1, 2, 3 in the group stage.
- **Lock** — Window when predictions become read-only. See
  `match_predictions_open()`.
- **Cravou** (pt-BR) — Exact score match. Worth `exact_score` points.
```

## Tone

- Direct. The contributor wants to skim and find what they need.
- Concrete. Always file:line over abstract description.
- Honest about uncertainty. If something is "I think the reason was X,
  but `git blame` would clarify" — say so.

## Anti-patterns

- ❌ Vague "the system handles X" — say HOW
- ❌ Quoting whole files — give file:line and 1-sentence summary
- ❌ Listing every file in the directory — pick the 3 most important
- ❌ Theory without code references
- ❌ Generic React/Supabase advice — explain THIS codebase, not the stack
- ❌ Bullet count > 5 in "Key concepts" — pick the most load-bearing

## Saving

By default, output to chat only.

If user asks to save: write to `docs/explainers/<slug>.md`. Otherwise
the one-pager is ephemeral — meant to bootstrap a session.

## Output language

Default pt-BR for the framing text. Code references and key concept
names stay in English to match identifiers.

# AI Workflow

This repository is "AI-first" — it ships agent definitions and slash commands
that calibrate AI tools to the codebase. This document tells you how to wire
your tool of choice.

## Tool entry points

### Claude Code (best supported)

Just open the repo. Setup is automatic:
- Agents in `.claude/agents/` (`frontend`, `supabase`, `scoring`, `code-reviewer`) appear in your agent list
- Skills in `.claude/skills/` register as slash commands (`/db-status`, `/mobile-audit`, etc.)
- Hooks in `.claude/hooks/` run automatically (typecheck after edits, migration warning before edits)
- `CLAUDE.md` is loaded as context per turn

Recommended workflow:

```text
> I want to add a "best of the week" highlight to the home screen.

Claude: I'll use the frontend agent. Let me start by reading the existing home.tsx...
```

For mobile-sensitive changes, end with:

```text
> /mobile-audit
```

Before risky changes, prepend:

```text
> /impact — I want to switch the cutoff from MD1 to MD2.
```

### Cursor

Cursor reads two sources:
- `.cursorrules` (legacy)
- Files referenced by symlink / configured in Cursor settings

This repo uses `AGENTS.md` at the root as the primary cross-tool spec.
To wire Cursor:

1. Open Settings → AI → "Rules for AI"
2. Add: `Read AGENTS.md and CLAUDE.md at the repo root before answering any question.`
3. Reference specific docs in your prompts when you need depth, e.g., "as a frontend specialist (see AGENTS.md), add a new MatchCard variant..."

### Aider

Aider auto-includes files you pass with `--read` or via `.aider.conf.yml`. Suggested config:

```yaml
# .aider.conf.yml (do not commit per-user values)
read:
  - AGENTS.md
  - CLAUDE.md
  - docs/PLAN.md
  - docs/SCORING.md
```

Or pass at invocation:

```bash
aider --read AGENTS.md --read CLAUDE.md src/routes/home.tsx
```

### Cline / Continue / Codex

These tools either auto-detect `AGENTS.md` or you reference it in the first
message of a conversation:

```text
Following the conventions in AGENTS.md and CLAUDE.md, add a hook
useMyBestWeeklyPalpite that ...
```

### No tool / human only

Read the docs by hand. `AGENTS.md` is the shortest start, `CLAUDE.md` adds
detail, and the specific `.claude/agents/*.md` files are the most thorough
domain specs. They're written as docs, not just prompts — useful even
without an AI in the loop.

---

## Recommended prompts (per task type)

### Adding a new screen / route

```text
Use the frontend agent. Add a new route `/me/achievements` that shows
the user's earned badges. Reuse PageHeader (with backTo), SubTabs if needed,
and MyPredictionRow patterns. Server data: there's no badges table yet —
propose a minimal schema and a `useMyAchievements(userId)` hook first.
```

### Touching the database

```text
Use the supabase agent. I want to add a new table `badges` and award one
when a user gets 5 exact-score predictions in a row. Walk me through the
migration, the RLS policies, and what to put in the edge function that
detects the condition.
```

### Changing scoring rules

```text
Use the scoring agent. The friends group wants the "exact score" bonus
to scale: 10 pts in MD1+MD2, 15 pts from MD3 onwards. Show me both files
that need updating, the scoring_config shape, and the recompute query.
```

### Auditing before a release

```text
Run /security-sweep then /db-status. Summarize the state for me before I
share the link with the broader group.
```

### Before a risky change

```text
/impact — I want to rename `kickoff_at` to `starts_at` throughout the codebase.
```

---

## What to AVOID asking an AI to do

These patterns produce bad results in this codebase:

- **"Just clean up the code"** without a target — vague, leads to thrashing.
- **"Add tests for everything"** — Vitest is set up (`pnpm test`, see `src/lib/*.test.ts`), so adding tests is welcome — but a blanket "test everything" is unscoped. Point the AI at a specific module (a hook, `src/lib/`, a component) so the work has clear boundaries.
- **"Make it look better"** without specifics — the design system is strict; ask for specific changes.
- **"Translate the UI to English"** — yes, that's a feature we want (i18n is on `docs/FOLLOWUPS.md`), but it's not a casual change. It involves a library choice, string extraction, and a toggle. Open an issue first.
- **"Speed things up"** without a profiler trace — premature optimization.

---

## When the AI gets it wrong

It will happen. Some patterns we've learned:

- If the agent suggests **polling** for live data, redirect it to `useRealtimeInvalidator` in `src/hooks/`.
- If it proposes **client-side writes** to `matches`/`teams`/`scores`, redirect to creating an edge function.
- If it suggests `position: sticky bottom-0` on BottomNav, point at the iOS scroll detachment lesson in `.claude/agents/frontend.md`.
- If it hardcodes scoring values, point at `useScoringConfig()` / `scoring_config` table.
- If it proposes editing an existing migration, the `migration-warning.sh` hook should already remind it — but also remind it yourself.

If you find a recurring AI mistake that the agents don't already catch,
**open a PR adding it to the relevant `.claude/agents/*.md` "Anti-patterns"
section**. The agent suite is intended to evolve with the project.

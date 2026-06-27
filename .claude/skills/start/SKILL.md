---
disable-model-invocation: true
name: start
description: |
  Bootstrap the AI agent for a new session in this repo. Reads CLAUDE.md +
  AGENTS.md, captures repo state (git, build, open issues/PRs), validates
  the local environment, and produces a briefing with suggested next actions.
  Run this at session start when about to do non-trivial work — it gets the
  agent contextualized in 30 seconds.
---

# /start — Session bootstrap

The user just opened the repo (or is resuming after a break). Run a fast,
read-only assessment of where things stand and tell them what's next.

## Steps

Run as many as possible in parallel. Read-only — never modify state here.

### 1. Identity check (5s)

Read the top of `CLAUDE.md` and `AGENTS.md`. Confirm in one sentence what
this repo is. Use the agent's mental model:

> "Bolão FIFA 2026 — mobile-first PWA pool for friends, React + Supabase,
> AI-first repo with specialized agents (frontend, supabase, scoring)."

### 2. Repo state

Run these in parallel:

```bash
git status --short                          # working tree state
git log --oneline -5                        # recent commits
git rev-parse --abbrev-ref HEAD             # current branch
git diff main..HEAD --stat 2>/dev/null      # branch progress (if not on main)
gh pr list --state open --limit 3 2>/dev/null
gh issue list --state open --limit 5 2>/dev/null
```

### 3. Environment health

Run in parallel:

```bash
node --version                              # must be 22+
pnpm --version
supabase status 2>/dev/null | head -5       # is local Supabase running?
lsof -i:5173 2>/dev/null | grep LISTEN      # is dev server running?
```

### 4. Build state (silent unless fails)

```bash
pnpm typecheck 2>&1 | tail -3
```

If typecheck fails, surface the error. If it passes, just note ✅.

### 5. Anomalies to surface

Flag explicitly if any of these is true:

- Working tree has uncommitted changes (could be lost)
- Branch ahead of `main` with no open PR (consider `/ship`)
- Node version < 22 (`/setup` will fix)
- Supabase not running (suggest `/dev`)
- Open issue labeled `good first issue` matches user's apparent interest

## Output format

Maximum 15 lines. Use this structure:

```
📍 You're in: <repo name>
🌿 Branch: <branch> (<N> commits ahead of main · <X> uncommitted)
📦 Env: node <ver> ✅ · pnpm <ver> ✅ · Supabase <running/stopped>
🏗️  Build: ✅ typecheck passes
🔧 Open PRs: <count> · Open issues: <count>

⚠️ <anomaly 1 if any>
⚠️ <anomaly 2 if any>

→ Suggested: <ONE concrete next action>
```

If everything is clean and there's no obvious next action, just suggest
`/feature` or `/bug` based on whether there are open issues.

## Output language

Mirror the user's language. Default pt-BR. Code/identifiers stay in English.

## Not in scope

- This command never edits files
- Never starts dev servers (use `/dev` for that)
- Never installs dependencies (use `/setup` for that)
- Never proposes a plan (use `/feature` or `/bug` for that)

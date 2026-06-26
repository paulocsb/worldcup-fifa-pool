# Bolão FIFA 2026

[![CI](https://github.com/paulocsb/bolao-fifa/actions/workflows/ci.yml/badge.svg)](https://github.com/paulocsb/bolao-fifa/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with AI](https://img.shields.io/badge/built%20with-AI%20agents-purple)](AGENTS.md)
[![PWA](https://img.shields.io/badge/PWA-installable-orange)](https://web.dev/progressive-web-apps/)

A mobile-first PWA for a friends' World Cup prediction pool — and an **AI-first
repository**: you develop here by talking to AI agents that already know the
codebase, not by reading 50 files first.

The 2026 World Cup was already underway when this was built, so the whole
project — schema, RLS, edge functions, UI, scoring, deploy — was driven through
AI agents calibrated to this repo, with a human at each checkpoint.
📖 *[The full story on Medium →](https://medium.com/@paulocsb/bolao-fifa-2026) (coming soon)*

---

## Develop here with AI

This is the intended way to work in the repo. Clone it, open it with your AI
tool (Claude Code, Cursor, Aider, Cline, Continue), and let it drive.

**1. Get the environment up**

```text
/setup     # installs deps, starts Supabase, sets up env + fixtures (idempotent)
/dev       # starts the dev stack and prints the URLs you need
/start     # optional: state briefing + suggested next action
```

**2. Do the work** — describe what you want in plain language:

```text
/feature "add a tiebreaker by exact-score count to the ranking"
/bug     "live score didn't update for GHA × PAN"
```

`/feature` runs a guided pipeline — **spec → impact → plan → implement →
verify → PR-ready** — and stops at each checkpoint for your approval.
`/bug` runs an investigation playbook — reproduce → isolate → root cause →
fix → validate.

**3. Ship it**

```text
/ship      # quality gate: typecheck, lint, test, build, review, secrets — then a PR body
```

Every command lives in [`.claude/skills/`](.claude/skills/) and is
self-documenting. Prefer to run things by hand, without an AI? See
[`docs/SETUP.md`](docs/SETUP.md) — same flow, manual steps.

### The agents that drive it

Four specialized agents in [`.claude/agents/`](.claude/agents/), each with deep
knowledge of this codebase's conventions and the anti-patterns already hit:

| Agent | Owns |
|---|---|
| `frontend` | UI, components, routes, hooks — mobile-first React/TS |
| `supabase` | DB schema, RLS, migrations, edge functions, cron |
| `scoring` | the dual scoring system (client preview ↔ server truth) |
| `code-reviewer` | independent, read-only review before a PR |

### The commands, by lifecycle stage

| Stage | Commands |
|---|---|
| **Start** | `/setup` · `/dev` · `/start` |
| **Build** | `/feature` · `/bug` · `/spec` · `/refactor` · `/explain` |
| **Check** | `/review` · `/verify` · `/ship` · `/mobile-audit` |
| **Operate** | `/db-status` · `/scoring-verify` · `/deploy-fn` · `/impact` · `/security-sweep` · `/release-notes` |

Other tools (Cursor, Aider, Cline, Continue) read the same conventions via the
cross-tool spec in [`AGENTS.md`](AGENTS.md). [Hooks](.claude/hooks/) auto-run a
typecheck after edits and warn before mutating an applied migration.

---

## What the app does

- 🎯 **Score predictions** per match, locked 5 minutes before kickoff
- 🏆 **Group + tournament predictions** (final order, champion, runner-up, 3rd)
- 📊 **Live ranking** that updates without refresh as matches end
- ⚡ **Quick predict** for fast batch prediction across many matches
- 🔐 **Invite-only** access with magic-link auth
- 📱 **PWA**: installable, offline-friendly for reads · 🌗 dark mode by default

## Make it yours

Nothing is locked in. Ask the AI agent in plain language and it runs the change
as a guided `/feature` flow, not a config flag:

- *"Switch hosting to Vercel"* — `frontend` updates Vite config, deploy script, `docs/DEPLOY.md`.
- *"Replace API-Football with TheSportsDB"* — `supabase` rewrites the integration and runs `/scoring-verify`.
- *"Brand the app for Euro 2028"* — `frontend` rewrites color tokens, swaps logos, updates the PWA manifest.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript · Vite 6 · Tailwind · shadcn/ui |
| State | TanStack Query · Supabase Realtime |
| Backend | Supabase (Postgres · Auth · Edge Functions · pg_cron · Vault) |
| Live data | API-Football |
| Hosting | Cloudflare Workers + Supabase managed + Resend (SMTP) |

Recurring cost: ~$19/month (just API-Football Pro). Everything else fits free tiers.

## Documentation

- [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) — using AI tools with this repo (all tools)
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — agent directives and conventions
- [`docs/PLAN.md`](docs/PLAN.md) — original scope and data model
- [`docs/SCORING.md`](docs/SCORING.md) — scoring pipeline and operational guide
- [`docs/FIFA-2026-FORMAT.md`](docs/FIFA-2026-FORMAT.md) — official tournament rules reference
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — production deploy playbook

## Contributing & license

Contributions are welcome, though I'm not actively recruiting — the repo mainly
documents an approach. To extend or borrow the AI-first pattern, see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

[MIT](LICENSE). The FIFA 2026 logos in `public/` belong to FIFA and are not
covered by this license — strip them if you fork for any other use.

---

<sub>Repository structure and AI-first tooling co-designed with Claude.</sub>

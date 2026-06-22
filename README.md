# Bolão FIFA 2026

[![CI](https://github.com/paulocsb/bolao-fifa/actions/workflows/ci.yml/badge.svg)](https://github.com/paulocsb/bolao-fifa/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with AI](https://img.shields.io/badge/built%20with-AI%20agents-purple)](AGENTS.md)
[![PWA](https://img.shields.io/badge/PWA-installable-orange)](https://web.dev/progressive-web-apps/)

> A mobile-first PWA for a friends' World Cup pool, **built mid-tournament** by
> orchestrating specialized AI agents through every phase of development —
> from spec to ship.

📖 **[Read the full story on Medium →](https://medium.com/@paulocsb/bolao-fifa-2026)** *(article coming soon)*

<!-- TODO: add hero screenshot here (iPhone mockup of /home + /matches) -->

---

## The story in one paragraph

The 2026 World Cup was already happening when I decided to build a prediction
pool for my friends group. Brazil's first match was days away. Writing the
whole thing solo, the conventional way, would mean shipping after Brazil was
already eliminated. So I tried something different: drive the entire
project — schema, RLS, edge functions, UI, scoring, deploy, debugging — through
AI agents calibrated to this codebase. **Spec → impact → plan → implement →
verify → ship**, with a human (me) holding the steering wheel at each
checkpoint. Three weeks later, ~20 friends are using it on their phones.

## What it does

- 🎯 **Score predictions** per match, locked 5 minutes before kickoff
- 🏆 **Group + tournament predictions** (final order, champion, runner-up, 3rd)
- 📊 **Live ranking** that updates without refresh as matches end
- ⚡ **Quick predict** Tinder-style mode for batch prediction
- 🔐 **Invite-only** access with magic-link auth
- 📱 **PWA**: installable, offline-friendly for reads
- 🌗 **Dark mode** by default, with toggle

## What makes it interesting

This isn't just "an app built with Claude". The repo ships a **calibrated
agent suite** that makes the AI productive on day one:

- **3 specialized agents** ([`.claude/agents/`](.claude/agents/)) — `frontend`, `supabase`, `scoring` — each with deep knowledge of the project's conventions, anti-patterns we've already hit, and which files to touch.
- **18 slash commands** ([`.claude/skills/`](.claude/skills/)) covering the full dev lifecycle: `/setup`, `/dev`, `/feature`, `/bug`, `/ship`, plus quality (`/spec`, `/review`, `/verify`, `/refactor`, `/explain`) and operational (`/db-status`, `/scoring-verify`, `/mobile-audit`, etc.).
- **Cross-tool spec** ([`AGENTS.md`](AGENTS.md)) so Cursor, Aider, Cline, and Continue read the same conventions.
- **Hooks** ([`.claude/hooks/`](.claude/hooks/)) that auto-typecheck after edits and warn before mutating applied migrations.
- **Real engineering rigor**: dual scoring implementation (client preview ↔ server truth) kept in sync, RLS on every table, idempotent cron-driven pipelines.

The result: a developer can open the repo with their AI tool of choice and
ship a real feature in their first session — without first reading 50 files.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript · Vite 6 · Tailwind · shadcn/ui |
| State | TanStack Query · Supabase Realtime |
| Backend | Supabase (Postgres · Auth · Edge Functions · pg_cron · Vault) |
| Live data | API-Football |
| Hosting | Cloudflare Workers + Supabase managed + Resend (SMTP) |

Recurring cost: ~$19/month (just API-Football Pro). Everything else fits free tiers.

## Try it locally

```bash
git clone git@github.com:paulocsb/bolao-fifa.git
cd bolao-fifa
pnpm install
supabase start
pnpm dev
```

Detailed walkthrough (env files, API-Football key, fixture sync):
[`docs/SETUP.md`](docs/SETUP.md).

If you're using Claude Code or another AI tool, just run `/setup` in your
agent — it walks the whole flow for you.

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — original scope and data model
- [`docs/SCORING.md`](docs/SCORING.md) — scoring pipeline and operational guide
- [`docs/FIFA-2026-FORMAT.md`](docs/FIFA-2026-FORMAT.md) — official tournament rules reference
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — production deploy playbook
- [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) — how to use AI tools with this repo
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — agent directives and conventions

## Want to contribute?

Contributions are welcome but I'm not actively recruiting. The repo is here
mainly to document an approach. If you'd like to extend it, fork it, or
borrow the AI-first pattern for your own project: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE). The FIFA 2026 logos in `public/` belong to FIFA and are not
covered by this license — strip them if you fork for any other use.

---

<sub>Repository structure and AI-first tooling co-designed with Claude.</sub>

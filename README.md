# Bolão FIFA 2026

[![CI](https://github.com/paulocsb/bola-fifa/actions/workflows/ci.yml/badge.svg)](https://github.com/paulocsb/bola-fifa/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![AI-first](https://img.shields.io/badge/AI--first-Claude%20%C2%B7%20Cursor%20%C2%B7%20Aider-purple)](AGENTS.md)
[![PWA](https://img.shields.io/badge/PWA-installable-orange)](https://web.dev/progressive-web-apps/)

> **An AI-first, mobile-first PWA for friend group football pools (Bolão) during the FIFA World Cup 2026.**
> Built with React + Vite + TypeScript on the front, Supabase on the back, and live data from API-Football.

This repository is designed to be contributed to with the help of AI agents (Claude Code, Cursor, Aider, etc).
The `.claude/` directory ships specialized agents and skills calibrated to this codebase, so a contributor
without deep familiarity can produce production-quality changes through their AI assistant of choice.

## AI agent suite at a glance

```mermaid
graph LR
    User[👤 Contributor] -->|uses| Tool{AI tool}
    Tool -->|Claude Code| Claude[.claude/]
    Tool -->|Cursor| Cursor[.cursor/rules/]
    Tool -->|Aider / Cline / Continue| Agents[AGENTS.md]

    Claude --> Agents
    Cursor --> Agents

    Agents -->|domain dispatch| F[frontend]
    Agents -->|domain dispatch| S[supabase]
    Agents -->|domain dispatch| C[scoring]

    F -->|edits| Src[src/]
    S -->|edits| Sup[supabase/]
    C -->|keeps in sync| Dual[src/lib/scoring.ts ↔<br/>supabase/functions/_shared/scoring.ts]

    Claude -.->|slash commands| Skills[/db-status /scoring-verify /deploy-fn<br/>/mobile-audit /impact /security-sweep /release-notes/]
```

See [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) for tool-specific entry points.

📚 **Detailed docs in `docs/`** — start with [PLAN.md](docs/PLAN.md) (scope & data model), [SETUP.md](docs/SETUP.md) (setting up from scratch), [SCORING.md](docs/SCORING.md) (scoring pipeline), and [DEPLOY.md](docs/DEPLOY.md) (production deployment).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 + Tailwind + shadcn/ui |
| Server state | TanStack Query + Supabase Realtime |
| Backend | Supabase (Postgres, Auth, Edge Functions, pg_cron, Vault) |
| Auth | Magic link (email) with invite-based gating |
| Live data | API-Football (api-sports.io) |
| Hosting (prod) | Cloudflare Workers + Supabase managed + Resend (SMTP) |
| PWA | vite-plugin-pwa (offline-friendly, installable) |

## Features

- **Invite-only access**: enter via `/login?invite=CODE` (admin generates codes from the in-app panel)
- **Match predictions**: per-match score predictions; lock 5 minutes before kickoff
- **Group predictions**: predict 1st–4th place per group; lock 5 minutes before MD3
- **Tournament predictions**: champion / runner-up / 3rd place; lock at end of group stage
- **Automatic scoring**: cron every minute syncs scores and recomputes points
- **Realtime ranking**: updates as soon as matches end, no manual refresh
- **Quick predict**: Tinder-style screen for fast bulk predicting with shortcuts (1-0, 2-1, etc)
- **Group standings**: live tables for the 12 groups
- **Match detail**: lineups, events (goals, cards, subs), and statistics from API-Football
- **PWA**: installable on phone, offline-friendly for reads
- **Dark mode**: default with toggle in the profile screen
- **Multiple ranking lenses**: see your own palpites (`/me/predictions`) and others after their lock window closes (`/u/:userId/predictions`)

## Design system

- **Typography**: Saira Condensed Black (display) + Noto Sans (body) — secondary FIFA brand
- **Color palette**: rainbow tokens by context, following the FIFA 2026 brand
  - 12 group colors (A–L)
  - 7 phase colors (group stage → final yellow)
  - 3 cerimonial positions (gold / silver / bronze)
- **Contextual background**: changes per section (group-stage green, knockouts purple, final yellow)
- **FIFA 2026 logo**: portrait + horizontal + light/dark variants, swaps automatically by theme

---

## Quick start (local development)

Prerequisites: **Node 22+**, **pnpm**, **Docker Desktop**, **Supabase CLI**.

```bash
# 1. Install deps
pnpm install

# 2. Start local Supabase (Postgres + Auth + Storage + Edge runtime)
supabase start

# 3. Migrations + seed run automatically; to reset:
# supabase db reset

# 4. Set up frontend env
cp .env.example .env.local
#    Copy VITE_SUPABASE_URL and ANON_KEY from `supabase status --output env`

# 5. Set up edge function env (API-Football)
cp supabase/functions/.env.example supabase/functions/.env
#    Add your API_FOOTBALL_KEY (sign up at https://www.api-football.com)

# 6. Restart Supabase so edge functions pick up the new .env
supabase stop && supabase start

# 7. Run the initial fixtures sync to populate matches
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"

# 8. Dev server
pnpm dev
#    Open http://localhost:5173/login?invite=amigos2026
#    (the 'amigos2026' invite code is seeded by the migrations)
```

Detailed walkthrough with troubleshooting: [`docs/SETUP.md`](docs/SETUP.md).

## Common commands

```bash
pnpm dev            # Vite dev server
pnpm build          # Production build (outputs dist/)
pnpm preview        # Serve dist/ locally (test the PWA)
pnpm typecheck      # tsc -b --noEmit
pnpm lint           # eslint

supabase status                  # local URLs and keys
supabase functions logs <name>   # logs of an edge function
supabase db reset                # wipe + reapply migrations + seed
supabase db push                 # push migrations to a linked remote project

# Trigger sync manually during dev
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"
```

---

## AI-first contribution workflow

This repo is set up so a contributor can drive most work through an AI agent. The `.claude/` directory contains specialized agents and skills:

### Specialized agents (`.claude/agents/`)

| Agent | Use when |
|---|---|
| `frontend` | Working in `src/components/`, `src/routes/`, `src/hooks/`, design system, mobile/PWA concerns |
| `supabase` | Migrations, RLS policies, edge functions (Deno), pg_cron, Vault |
| `scoring` | Anything touching the dual scoring system (client preview ↔ server truth) |

### Slash commands (`.claude/skills/`)

| Command | Use when |
|---|---|
| `/db-status` | Health check the DB before schema changes |
| `/scoring-verify` | Validate scoring pipeline in production |
| `/deploy-fn <name>` | Deploy + smoke test an edge function |
| `/mobile-audit` | 10-criteria checklist before declaring UI work done |
| `/impact` | Map blast radius of a proposed change before implementing |
| `/security-sweep` | Periodic RLS / secrets / auth audit |
| `/release-notes` | Generate user-friendly changelog in pt-BR for friends group |

### Hooks (`.claude/hooks/`)

- **Post-turn**: silent `pnpm typecheck` after edits in `src/` (surfaces only on failure)
- **Pre-edit**: warning when editing an already-applied migration (immutable in production)

### Working with other AI tools

`AGENTS.md` in the repository root is a tool-agnostic agent specification that
Cursor, Aider, Cline, Continue, and Codex can read. See [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md)
for tool-specific entry points.

---

## Project structure

```
.
├── public/                    # static assets (FIFA logos, PWA icons)
├── src/
│   ├── components/            # UI components (MatchCard, PageHeader, etc.)
│   │   └── match/             # specific to /matches/:id (Events, Lineups, Stats)
│   ├── hooks/                 # TanStack Query hooks + helpers
│   ├── routes/                # one file per route; nested under predictions/, me/, u/
│   ├── lib/                   # supabase client, scoring, format, groupColors, dicebear
│   └── types/db.ts            # types generated by `supabase gen types`
├── supabase/
│   ├── migrations/            # versioned schema
│   └── functions/             # edge functions (Deno)
│       ├── _shared/           # api-football client, scoring lib, team aliases
│       ├── sync-fixtures/
│       ├── sync-live/
│       ├── sync-match-detail/
│       └── compute-scores/
├── docs/
│   ├── PLAN.md                # original scope & data model
│   ├── FIFA-2026-FORMAT.md    # official tournament rules (groups, phases, tiebreakers)
│   ├── REBRAND.md             # design system spec
│   ├── DEPLOY.md              # production deployment playbook
│   ├── SCORING.md             # scoring pipeline operational guide
│   ├── SETUP.md               # contributor setup from scratch
│   └── AI-WORKFLOW.md         # how to use AI tools with this repo
├── .claude/                   # Claude Code agent suite (also informs other tools)
├── AGENTS.md                  # cross-tool agent spec
├── CLAUDE.md                  # agent directives (priority over AGENTS.md for Claude Code)
└── CONTRIBUTING.md            # how to contribute
```

## Edge functions

| Function | Schedule | Purpose |
|---|---|---|
| `sync-fixtures` | cron every 6h | upsert all fixtures + teams of the World Cup |
| `sync-live` | cron every minute | score + minute + status; triggers compute-scores on transitions |
| `compute-scores` | invoked by sync-live (or hourly safety-net cron) | apply scoring to predictions of finished matches |
| `sync-match-detail` | invoked from the client when /matches/:id opens | lineups, events, stats (TTL 60s for live) |

All use the shared API-Football client in `supabase/functions/_shared/api-football.ts`.

## Scoring system

Configurable values live in the `public.scoring_config` table:

- **Per match**: 10 exact score · 5 correct result · 2 correct goal-difference
- **Per group**: 5 (1st) · 5 (2nd) · 3 (3rd) · 2 (4th) · +3 bonus per qualifier in the round of 32
- **Tournament**: 30 champion · 15 runner-up · 10 third place
- **Cutoff**: MD1 of the group stage doesn't count (`group_matchday_start = 2`) — equity rule for app shipping mid-Cup
- **Lock**: 5 minutes before individual kickoff; group locks before MD3; tournament locks at end of group stage

Logic lives in **`src/lib/scoring.ts`** (client preview) mirrored in **`supabase/functions/_shared/scoring.ts`** (server source of truth). The two must stay in sync — see the `scoring` agent for guidance.

## Invite system

- Table `public.invites` with `code`, `description`, `max_uses`, `expires_at`, `uses_count`
- Trigger `profiles_consume_invite` validates and consumes on INSERT to `profiles`
- First signup automatically becomes admin
- Admin manages invites at `/invites` (UI), creating custom or random codes

## Production deployment

See [`docs/DEPLOY.md`](docs/DEPLOY.md) — step-by-step playbook, ~1h45 from zero to running.

Selected stack: **Cloudflare Workers + Supabase managed + Resend SMTP + Cloudflare DNS**.

Recurring cost: ~$19/month (API-Football Pro only — all other services on free tiers for this scale).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). TL;DR:

1. Fork + clone
2. Follow `docs/SETUP.md` to bring up your own local instance
3. Pick an issue (or propose one)
4. Use the AI agent of your choice with the `.claude/` agents/skills as context
5. Submit a PR — CI will typecheck and build

## License

[MIT](LICENSE). The FIFA 2026 logos and brand assets in `public/` are property of FIFA and not covered by this license — they're included for personal/educational use only. Strip or replace them before forking for any other purpose.

---

🤖 Repository structure and AI-first tooling co-designed with Claude.

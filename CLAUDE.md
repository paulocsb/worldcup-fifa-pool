# CLAUDE.md — Bolão FIFA 2026

Directives for AI agents (Claude Code) working in this repository. Read this
before making any change.

> **Canonical documents** (precedence order in case of conflict):
> 1. [`docs/FIFA-2026-FORMAT.md`](docs/FIFA-2026-FORMAT.md) — official tournament rules (groups, phases, qualification, tiebreakers). Source of truth for any format question.
> 2. [`docs/PLAN.md`](docs/PLAN.md) — approved implementation plan (scope, data model, scoring, delivery phases).
> 3. This CLAUDE.md — agent directives.

---

## 1. Project context

A **FIFA World Cup 2026 prediction pool ("Bolão")** app for a group of friends.
**Mobile-first** (most users access via phone). The World Cup began on
**June 11, 2026** and the app was built in parallel with the tournament —
shipping value quickly beats perfection.

**Equity rule**: matches played before June 15, 2026 don't score for anyone.
Communicated during onboarding.

The user-facing audience is **Brazilian Portuguese (pt-BR)**. The codebase,
docs, agents, and skills are in English so non-Portuguese contributors can
help. Conversations with the user mirror the user's language (default pt-BR).

---

## 2. Stack & conventions

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query (`@tanstack/react-query`) |
| Routing | React Router (`react-router-dom`) |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions, Storage, Vault) |
| Live data | API-Football (api-sports.io) |
| Avatars | DiceBear (URL generated from seed) |
| Dates / i18n | `date-fns` with `pt-BR` locale |
| Package manager | pnpm |
| Hosting (prod) | Cloudflare Workers (frontend, `wrangler.jsonc`) + Supabase managed (backend) |

**Code conventions**:
- Strict TypeScript (`strict: true`, no implicit `any`). Types generated via `supabase gen types typescript`.
- Components in PascalCase; hooks in `useCamelCase`; route filenames in kebab-case (`match-detail.tsx`), components in PascalCase (`MatchCard.tsx`).
- Absolute imports via the `@/` alias (configured in `vite.config.ts` + `tsconfig.json`).
- Tailwind with `prefers-color-scheme` for automatic dark mode.
- UI strings in **pt-BR** (audience: Brazilian friends).
- Tap targets ≥ 44px; layout tested from 320px width.

**Folder structure**: see tree in `docs/PLAN.md`. Follow exactly to avoid drift.

---

## 3. External skills to use (Claude Code generic harness)

When the task fits, invoke the corresponding skill **before** coding/answering:

| Task | Skill |
|---|---|
| React + TypeScript + Tailwind + shadcn architecture/review | `react-typescript-stack` |
| Mobile UX, responsive, performance, accessibility patterns | `frontend-expert` |
| Re-planning a feature or non-trivial refactor | `/plan` (this harness's `plan` skill) |
| Simplify / review changed code | `simplify` |
| Review PR or change set | `review` |
| Security audit of pending changes | `security-review` |
| Polling loop in deploy/CI | `loop` |
| Scheduling recurring tasks (e.g., monitor daily sync) | `schedule` |

For broad exploratory codebase investigations, use the `Explore` agent. For
implementations requiring architecture/trade-off analysis, use `Plan`. Routine
code writing just needs the matching skill.

> **Do not invent skill names.** Use only what is listed in the session's system reminder.

For project-specific agents and slash commands, see sections 9 and 10 below.

---

## 4. Workflow (planning → dev → debugging)

### 4.1 Planning (`/plan`)
1. For any change touching more than 2 files, new features, or affecting schema/RLS: start with `/plan`.
2. The `Plan` agent should consult `docs/PLAN.md` to align context before proposing.
3. Approved plan → proceed to implementation. Substantial plan becomes the PR description.

### 4.2 Development
1. Invoke the `react-typescript-stack` skill for any component/hook/route work. For UX, responsive layout, animations, accessibility — also add `frontend-expert`.
2. Before creating a new file, **search for existing utilities** in `src/lib/`, `src/hooks/`, `src/components/`. Reuse > new code.
3. Keep `src/lib/scoring.ts` (client) in sync with `supabase/functions/_shared/scoring.ts` (server). The server is the source of truth; the client is just preview.
4. Every write to `predictions`, `group_predictions`, `tournament_predictions` must be validated by **RLS** (not just the client). When creating/altering a policy, provide a SQL test the user can run.
5. Migrations are versioned in `supabase/migrations/YYYYMMDDNNNNNN_description.sql`. Never edit a migration already applied to production — always create a new one.
6. shadcn components are installed on demand via `pnpm dlx shadcn@latest add <component>` and live in `src/components/ui/`. Don't edit them directly — prefer wrappers in `src/components/`.

### 4.3 Debugging
1. Reproduce the bug with concrete inputs before theorizing.
2. Edge Function logs: `supabase functions logs <name>` or via the dashboard.
3. For RLS issues: test as `anon` role in the Supabase SQL editor with `SET request.jwt.claims = '{...}'`.
4. For API-Football sync issues: check `last_synced_at` on the `match` and `sync-live` function logs.
5. Mobile UI: test on a real device via `vite --host` before declaring a fix done. DevTools responsive mode alone is not enough.
6. For deep bugs, consider using the `Plan` agent to map root cause + fix before touching the code.

### 4.4 Review & merge
1. Before declaring a task done: run `pnpm typecheck`, `pnpm lint`, `pnpm test` (where they exist).
2. Invoke the `simplify` skill on the change set to eliminate missed reuse and dead code.
3. For PRs with sensitive changes (RLS, scoring, auth): invoke `security-review`.
4. Commits without `--no-verify`. Failing hooks should be fixed, not bypassed.

---

## 5. Common commands

```bash
# Initial setup (run once)
pnpm install
supabase start                              # local Postgres + Studio
supabase db reset                           # apply migrations + seeds
supabase gen types typescript --local > src/types/db.ts

# Development
pnpm dev                                    # Vite at http://localhost:5173
pnpm dev --host                             # exposed on LAN (real mobile testing)
supabase functions serve sync-live          # run edge function locally

# Operations
supabase functions invoke sync-fixtures     # manual sync
supabase db push                            # push migrations to remote
supabase functions deploy compute-scores    # deploy an edge function

# Quality
pnpm typecheck
pnpm lint
pnpm test
```

---

## 6. Security & sensitive data

- **Never** commit `.env`, `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`. Keep `.env.example` up to date with empty values.
- Service role key **only** in Edge Functions. Client uses only `VITE_SUPABASE_ANON_KEY`.
- RLS enabled on **every** table. Default = deny. Every new table requires explicit policies.
- Validate the prediction lock in **two places** (client UX + server RLS). Client is cosmetic; server is security.

---

## 7. Do not

- ❌ Do not introduce multiple pools (explicitly out of MVP scope).
- ❌ Do not write to `matches`, `teams`, or `scores` from the client — only Edge Functions.
- ❌ Do not use polling on the client for live scores — use Supabase Realtime.
- ❌ Do not import components from `src/components/ui/` into other `ui/`. Composition lives in `src/components/`.
- ❌ Do not amend commits already pushed to the remote.
- ❌ Do not create documentation files (READMEs, NOTES) without explicit user request. Exceptions: this `CLAUDE.md` and `docs/PLAN.md`.

---

## 8. Language

- **Code, identifiers, comments (when unavoidable), commit messages, docs**: English.
- **UI strings and user-facing error messages**: pt-BR (audience is Brazilian).
- **Conversations with the user in this repository**: mirror the user's language. Default pt-BR (demonstrated preference); follow if they switch to English.

---

## 9. Specialized agents (when to invoke)

This repo has local agents in `.claude/agents/` with deep codebase knowledge.
Prefer them over the generic agents (Plan, Explore) when the task falls within
their scope.

| Task | Agent | Complementary skill |
|---|---|---|
| New/changed UI, component, or route | `frontend` | `react-typescript-stack` + `frontend-expert` |
| Deep mobile/responsive review | `frontend` (mobile-native by design) | `/mobile-audit` |
| Migration, RLS, schema, edge function | `supabase` | `security-review` (sensitive change) |
| Scoring change (formula, cutoff, config) | `scoring` | `/scoring-verify` |
| Code review before PR/big commit | `code-reviewer` *(if available)* + domain agent | `security-review` |
| Plan a non-trivial feature | `Plan` (generic) | `/plan` |
| Broad codebase search | `Explore` (generic) | — |

**Routing rule**: if the task is multi-domain (e.g., feature touches UI + DB + scoring), invoke agents in **parallel** (a single call with multiple Agent tool uses) to reduce wall-clock time.

---

## 10. Project slash commands

Local skills in `.claude/skills/`:

### Utility (routine)
| Command | Use |
|---|---|
| `/db-status` | Database health check before schema changes (cron, RLS policies, stuck matches, ranking sanity) |
| `/scoring-verify` | Validate scoring in production (finished matches without scores, recompute) |
| `/deploy-fn <name>` | Deploy + smoke-test an edge function |

### Senior (decision / risk)
| Command | Use |
|---|---|
| `/mobile-audit` | Mobile/PWA checklist before declaring UI work done (10 criteria) |
| `/impact` | Blast-radius map of a proposed but not-yet-implemented change |
| `/security-sweep` | Periodic RLS / secrets / auth audit (pre-release, before mass onboarding) |
| `/release-notes` | Friendly pt-BR changelog for the friends group (WhatsApp) |

**Usage rule**:
- Before schema/scoring change → `/impact`
- Before declaring UI done → `/mobile-audit`
- Pre-release or after RLS change → `/security-sweep`
- Before announcing to friends → `/release-notes`

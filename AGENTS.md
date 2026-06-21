# AGENTS.md — cross-tool agent spec

This file is a tool-agnostic agent specification for the Bolão FIFA 2026 repo.
It is read by **Cursor**, **Aider**, **Cline**, **Continue**, **Codex**, and any
other AI tool that supports the emerging `AGENTS.md` convention.

For Claude Code users, the richer agent setup lives in `.claude/` (3 specialized
agents + 7 slash commands + 2 hooks). The directives in this file mirror the
shared subset. In case of conflict, `CLAUDE.md` and `.claude/agents/*.md` take
precedence for Claude Code; this file is the source of truth for everyone else.

---

## Project at a glance

- **What**: a mobile-first PWA for a friends' FIFA World Cup 2026 prediction pool ("Bolão")
- **Stack**: React 18 + TypeScript + Vite 6 + Tailwind + shadcn/ui + TanStack Query (frontend); Supabase (Postgres + Auth + Edge Functions + pg_cron + Vault); API-Football (live data); Cloudflare Pages (hosting); Resend (SMTP)
- **Audience**: Brazilian friends. UI strings are pt-BR. Codebase + docs are English.
- **Status**: shipped to production. ~20 users. Built mid-tournament starting 2026-06-15.

## Key documents (read in this order)

1. `README.md` — overview + setup
2. `docs/SETUP.md` — contributor setup walkthrough
3. `docs/PLAN.md` — original scope and data model
4. `docs/FIFA-2026-FORMAT.md` — official tournament rules (canonical for any format question)
5. `docs/SCORING.md` — scoring pipeline operational guide
6. `docs/DEPLOY.md` — production deployment playbook
7. `docs/REBRAND.md` — design system spec
8. `docs/FOLLOWUPS.md` — parked items and known follow-ups
9. `CLAUDE.md` — directive doc (mostly Claude-Code-specific, but most is generally useful)

## Conventions (must follow)

### File layout
- `src/components/ui/` — shadcn primitives. **Never edit directly.** Wrap them in `src/components/`.
- `src/components/` — shared composed components (PascalCase)
- `src/components/match/` — match-detail subcomponents
- `src/routes/` — one file per route. Kebab-case filenames (`match-detail.tsx`), PascalCase component names (`MatchDetailPage`).
- `src/hooks/` — `useCamelCase`. One hook per file.
- `src/lib/` — pure utilities, no React imports.
- `supabase/migrations/` — versioned, named `YYYYMMDDNNNNNN_description.sql`. **Immutable once applied.**
- `supabase/functions/` — Deno edge functions. Each has its own `index.ts`. Shared code in `_shared/`.

### Language
- Code, identifiers, comments, commit messages, docs: **English**.
- User-facing UI strings: **pt-BR**.
- Conversation: mirror the user's language. They typically write in pt-BR — default pt-BR. Switch to English if they switch.

### TypeScript
- Strict mode: `strict: true`, no implicit `any`.
- Types generated from Supabase: `supabase gen types typescript --linked > src/types/db.ts`.
- Discriminated unions for variant shapes.
- Zod for runtime validation at boundaries.

### State management
- Server state: TanStack Query. Key shape: `[resource]` or `[resource, id]`.
- Local UI state: `useState`/`useReducer`.
- Form state: controlled inputs + Zod.
- URL state: `useSearchParams`.

### Styling
- Tailwind with `cn()` utility (`src/lib/utils.ts`).
- Design tokens in `src/index.css` (HSL CSS variables).
- 12 group colors (A–L), 7 phase colors, 3 cerimonial colors (gold/silver/bronze).
- `font-display` (Saira Condensed Black) for headers/numbers; `font-sans` (Inter / Noto Sans) for body.

### Mobile-first (non-negotiable)
- Baseline 320px width. No horizontal overflow ever.
- Tap targets ≥ 44×44px (`h-11`).
- `h-dvh` for the root viewport, NOT `100vh`.
- BottomNav in flow inside a flex column, NOT `sticky bottom-0` (we've debugged this).
- `safe-area-inset-*` for iOS notch + home indicator.
- No hover-only states (touch fallback always present).
- Test on a real iPhone via `pnpm dev --host` for any visual change.

### Realtime
- Live data via Supabase Realtime + `useRealtimeInvalidator({ tables, queryKeys })`.
- NEVER poll in a `useEffect` loop.

### Security
- RLS enabled on every `public.*` table. Default deny.
- Service role key only in Edge Functions. Client uses `VITE_SUPABASE_ANON_KEY`.
- Lock validated in two places: client (UX) + server RLS (security).
- Client never writes to `matches`, `teams`, `scores`, `scoring_config`. Those are server-only.

### Scoring (dual implementation)
- `src/lib/scoring.ts` (client preview) AND `supabase/functions/_shared/scoring.ts` (server truth) must stay in sync.
- All values configurable via the `scoring_config` table — no hardcoded points.
- `compute-scores` is idempotent (upsert on `(user_id, source, match_id, group_letter)`).
- Cutoff: `group_matchday_start = 2` (MD1 of group stage doesn't score — equity rule).

## Anti-patterns (NEVER repeat)

- ❌ Editing an already-applied migration → create a new one
- ❌ `sticky bottom-0` on the BottomNav → use the inner scroll pattern
- ❌ `100vh` on the layout root → use `h-dvh`
- ❌ Polling for live scores → use Realtime
- ❌ Hardcoded scoring values → use `scoring_config`
- ❌ Client writes to protected tables → use Edge Functions
- ❌ Importing from `src/components/ui/` into other `ui/` → compose in `src/components/`
- ❌ Body-text in `gold` color → use only for icons/borders/highlights (poor contrast)
- ❌ Commits with `.env*` files → only `.env.example` is versioned
- ❌ Service role key in client code → server-only

## Workflow

1. **For non-trivial changes** (>2 files, schema/RLS, scoring): plan first, code second.
2. **Reuse over new code**: grep `src/hooks/`, `src/lib/`, `src/components/` before creating files.
3. **Before declaring done**: `pnpm typecheck && pnpm build` must pass.
4. **For UI changes**: test on a real device via `pnpm dev --host`.
5. **For migrations or RLS**: provide a verification SQL query the user can run on the dashboard.

## Common commands

```bash
pnpm dev                       # local dev server
pnpm dev --host                # LAN-exposed (real-device testing)
pnpm typecheck && pnpm build   # validation

supabase start                 # local Postgres + Studio
supabase db reset              # apply migrations + seed
supabase db push               # push migrations to linked remote
supabase functions deploy <n>  # deploy an edge function
supabase functions logs <n>    # tail edge function logs

# Manual sync trigger
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"
```

## Edge functions (catalog)

| Function | Trigger | What it does |
|---|---|---|
| `sync-live` | cron 1/min | updates scores/status; fires `compute-scores` on transitions |
| `sync-fixtures` | cron 1/6h | imports/updates fixtures |
| `compute-scores` | sync-live OR cron 1/h | idempotent upsert into `scores` |
| `sync-match-detail` | client request | events/lineups/stats on demand |

## Helper functions (use, don't re-implement)

In the `public` schema:
- `match_predictions_open(p_match_id int) → boolean`
- `group_predictions_open(p_group_letter char(1)) → boolean`
- `tournament_predictions_open() → boolean`
- `invoke_edge_function(fn_name text, body jsonb default '{}') → bigint`

Use these in RLS policies and `compute-scores`. Do not inline the same logic.

## When you're stuck

- Search the docs (`docs/`) first.
- Read the matching `.claude/agents/*.md` file (works as docs even outside Claude Code).
- Look at git log for similar past changes.
- Open an issue / discussion if the answer isn't apparent.

# Bolão FIFA 2026 — Implementation Plan

## Context

Build a prediction-pool ("Bolão") app for a group of friends during the FIFA
World Cup 2026. **High urgency**: as of 2026-06-15 the World Cup had already
started on June 11 — some group-stage matches had already happened. Decision:
those past matches are blocked (no one scores) and the pool begins counting
from the next matches onward, ensuring fairness across all participants.

The app is mobile-first (most access via phone), with magic-link auth,
predictions locked 5 minutes before kickoff, live ranking, and sync with the
official World Cup data. Scope is a single pool (the user's friend group) —
no multi-pool support in the MVP.

## Stack

- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, TanStack Query, React Router
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage, Vault)
- **Auth**: Magic link (Supabase Auth)
- **Live data**: API-Football (api-sports.io) — fixtures, lineups, events, stats
- **Avatars**: DiceBear (generated from a seed stored in `profiles.avatar_seed`)
- **Hosting**: Cloudflare Pages (frontend) + Supabase managed (backend)

## Data model (Postgres / Supabase)

```sql
-- Auth & profile
profiles (id uuid PK FK auth.users, display_name, avatar_seed text, avatar_style text,
          favorite_team_id int FK teams, is_admin bool, created_at)

-- Tournament structure
teams (id int PK [API-Football id], name, code, flag_url,
       group_letter char [A..L], fifa_ranking int nullable)
matches (id int PK [API-Football fixture_id], home_team_id, away_team_id,
         kickoff_at timestamptz,
         stage text [group|round_of_32|round_of_16|quarter_final|semi_final|third_place|final],
         group_letter char nullable, status text [scheduled|live|finished|cancelled],
         home_score int nullable, away_score int nullable,
         home_score_extra int nullable, away_score_extra int nullable,
         home_score_penalties int nullable, away_score_penalties int nullable,
         venue text, last_synced_at timestamptz)

-- Computed standings (cached via API or edge function)
group_standings (group_letter char PK part, team_id int PK part,
                 position int, played int, won int, drawn int, lost int,
                 goals_for int, goals_against int, points int,
                 advanced_to_r32 bool nullable)

-- Predictions
predictions (id, user_id FK profiles, match_id FK matches,
             home_score int, away_score int,
             created_at, updated_at,
             UNIQUE (user_id, match_id))

group_predictions (id, user_id, group_letter,
                   first_team_id, second_team_id,
                   third_team_id, fourth_team_id,
                   UNIQUE (user_id, group_letter))

tournament_predictions (user_id PK, champion_team_id,
                        runner_up_team_id, third_place_team_id,
                        locked_at)

-- Scoring (computed cache from edge function)
scores (id, user_id, source text [match|group|tournament],
        match_id nullable, group_letter nullable,
        points int, breakdown jsonb, computed_at)

-- Configuration
scoring_config (key PK, value jsonb)  -- points per type, editable by admin

-- Invite gating
invites (code PK, description, max_uses int, expires_at, uses_count, created_by, created_at)
```

**RLS (Row Level Security)**:
- `profiles`: public SELECT, UPDATE only own
- `predictions` / `group_predictions` / `tournament_predictions`: SELECT own (and public SELECT after the item's lock closes), INSERT/UPDATE only own if `kickoff_at - now() > 5 min` and match `status = 'scheduled'`
- `matches`, `teams`, `scores`, `scoring_config`: public SELECT, writes only via Edge Functions (service role)

> **Official tournament format** documented in [`docs/FIFA-2026-FORMAT.md`](FIFA-2026-FORMAT.md) — source of truth for groups (A–L), phases, qualification (top 2 + 8 best 3rds → Round of 32), tiebreakers, and bracket.

## Scoring rules (configurable defaults)

**Per match**
- **Exact score**: 10 pts
- **Correct result (W/D/L)**: 5 pts (does not stack with exact score)
- **Correct goal difference** (when not exact): +2 pts

**Group-qualification bonus** (computed after the group stage ends, 06-27)
- **Correct 1st**: 5 pts
- **Correct 2nd**: 5 pts
- **Correct 3rd**: 3 pts
- **Correct 4th**: 2 pts
- **Got the "8 qualifying teams" trio right**: +3 pts per team correctly placed in the 32 that advance (top 2 guaranteed + 3rd that lands among the 8 best 3rds)

**Tournament bonus**
- **Champion**: 30 pts
- **Runner-up**: 15 pts
- **Third place**: 10 pts

> **Special — launching mid-tournament**: the champion/runner-up/3rd prediction stays open **until 2026-06-27** (end of group stage), because the app comes online with the tournament already in progress. Communicate during onboarding.

Rules are editable in `scoring_config` for adjustments before any lock.

### Tiebreakers (reference)
The pool **does not recompute** the FIFA tiebreakers. The group's final
`position` column is read from the API-Football payload, which already applies
head-to-head, overall goal difference, goals, fair play, and FIFA ranking per
regulation (see `FIFA-2026-FORMAT.md` §3.1).

## File structure (greenfield)

```
fifa-bolao/
├── src/
│   ├── main.tsx, App.tsx
│   ├── lib/
│   │   ├── supabase.ts          # client + types
│   │   ├── scoring.ts           # point calc (mirrors edge function)
│   │   ├── dicebear.ts          # avatar URL generator
│   │   └── format.ts            # dates/times (date-fns + pt-BR)
│   ├── routes/
│   │   ├── login.tsx            # magic link
│   │   ├── onboarding.tsx       # name, avatar, favorite team, tournament prediction
│   │   ├── home.tsx             # upcoming matches + my position
│   │   ├── matches.tsx          # list with filters (phase/group/day/status)
│   │   ├── match-detail.tsx     # score, lineups, stats, prediction
│   │   ├── predictions/
│   │   │   ├── index.tsx        # my predictions
│   │   │   ├── groups.tsx       # standings of the 12 groups
│   │   │   └── tournament.tsx   # champion/runner-up/3rd
│   │   ├── ranking.tsx          # leaderboard
│   │   ├── profile.tsx          # other participant's profile
│   │   └── settings.tsx
│   ├── components/
│   │   ├── BottomNav.tsx        # mobile bottom navigation
│   │   ├── MatchCard.tsx, MatchListItem.tsx
│   │   ├── PredictionSheet.tsx  # bottom sheet with score steppers
│   │   ├── LeaderboardRow.tsx
│   │   ├── Avatar.tsx           # DiceBear
│   │   ├── Countdown.tsx        # countdown to lock
│   │   ├── LiveBadge.tsx, ScoreDisplay.tsx
│   │   └── ui/ ...              # shadcn primitives
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMatches.ts, useMatch.ts
│   │   ├── usePrediction.ts
│   │   ├── useRanking.ts
│   │   └── useRealtimeMatch.ts  # Supabase Realtime subscribe
│   └── types/
│       ├── db.ts                # generated via `supabase gen types`
│       └── domain.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql         # schema + RLS + seed scoring_config
│   │   └── 002_seed_teams.sql   # 48 teams + groups A–L
│   └── functions/
│       ├── sync-fixtures/       # cron: refresh fixtures + lineups
│       ├── sync-live/           # cron: live status + score updates
│       └── compute-scores/      # trigger: on match.status=finished
├── .env.example                 # SUPABASE_URL, ANON_KEY, API_FOOTBALL_KEY
├── vite.config.ts, tailwind.config.ts, tsconfig.json
└── package.json
```

## Sync strategy (Edge Functions)

1. **`sync-fixtures`** — cron every 6h: fetches `/fixtures?league=1&season=2026` (World Cup) and upserts into `matches` + `teams`.
2. **`sync-live`** — cron every minute on match days: updates scores, status, and statistics; safety-net handles matches stuck in `live` across UTC midnight.
3. **`compute-scores`** — invoked when a match transitions to `status='finished'`: runs `scoring.ts` on the server over all predictions for that match and upserts into `scores`. At the end of each completed group stage, computes qualification bonuses. At the end of the tournament, computes champion/runner-up/3rd bonuses.

Frontend uses **TanStack Query** for fetching + **Supabase Realtime** subscribes on `matches` and `scores` for live UI updates without polling.

## Prediction lock

- Validated in **two places**:
  1. **Client**: disables UI when `kickoff_at - now() ≤ 5 min` or `status ≠ 'scheduled'`.
  2. **RLS in Postgres**: INSERT/UPDATE policies on `predictions` check the same predicate (defense against direct requests).
- For already-played matches (between 06-11 and 06-15): `status` is already `finished` → RLS blocks naturally. UI shows them with an "out of pool" tag and they don't score.

## Mobile-first UX

- **Fixed bottom tab bar**: Home / Matches / Standings / Ranking / Profile
- **Sheet/Modal** for predicting with large `+/-` steppers (tap target ≥44px)
- **Match cards** with countdown to kickoff and animated LIVE badge
- Layout tested from 320px (iPhone SE) with `sm:`, `md:` breakpoints for tablet/desktop
- **Dark mode** automatic via `prefers-color-scheme`
- **Basic PWA** (manifest + service worker) for "Add to Home Screen"

## Delivery phases (given the urgency)

**Phase 1 — Rushable MVP (2–3 days)**
- Magic-link auth, schema + RLS, teams/groups seed via 002_seed_teams.sql
- Initial fixtures sync (run `sync-fixtures` manually once)
- Match list + predict + lock
- Basic match scoring + ranking
- Bottom nav + minimum onboarding (name + DiceBear avatar)

**Phase 2 — Complete features (3–5 days after Phase 1)**
- Group + tournament predictions (champion/runner-up/3rd) with bonus
- Lineups + statistics in match detail
- Realtime score updates
- Other participants' profiles + favorite team
- PWA + dark mode polish

**Phase 3 — Polish**
- Notifications (web push or pre-match email)
- Per-match score history
- Aggregate stats (accuracy %, best prediction)

## Environment variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Server-only (edge functions):
SUPABASE_SERVICE_ROLE_KEY=
API_FOOTBALL_KEY=
API_FOOTBALL_LEAGUE_ID=1     # World Cup
API_FOOTBALL_SEASON=2026
```

## End-to-end verification

1. **Setup**: `pnpm create vite@latest . --template react-ts` + `supabase init` + apply migrations.
2. **Auth**: request a magic link at `/login`, open the email, redirect works, session persists.
3. **Onboarding**: create a profile with DiceBear avatar (multiple seeds), favorite team, champion prediction.
4. **Initial sync**: invoke `supabase functions invoke sync-fixtures` locally; verify 104 matches + 48 teams populated; past matches with `status='finished'`.
5. **Predicting**: for a future match, save a prediction; try to edit <5min before kickoff → blocked client + server (test via direct curl).
6. **Scoring**: manually mark a match as `finished` with a score and invoke `compute-scores`; verify rows in `scores` with correct `breakdown`.
7. **Ranking**: leaderboard updated, ordered by sum of points, with avatars.
8. **Real mobile**: open on phone in local network (`vite --host`); test predicting with your thumb; verify viewport 320–430px without overflow.
9. **Realtime**: two browsers; admin updates a LIVE match score → other screen updates without refresh.
10. **RLS**: try via direct SQL (anon role) reading another user's predictions before kickoff → should fail.

## Risks & mitigations

- **API-Football quota**: free plan has ~100 req/day. Mitigation: `sync-fixtures` 4×/day + `sync-live` only with an active match = ~50–100 reqs on a match day. Upgrade to the paid plan ($20/month) if needed.
- **Magic link + email deliverability**: configure custom SMTP in Supabase (Resend free) to avoid spam folder; test before inviting friends.
- **Short time vs ongoing World Cup**: Phase 1 delivered before the next round (06-16 to 06-17). Communicate the "pre-06-15 matches don't score" rule to friends during onboarding.
- **2026 Cup format**: 48 teams, 12 groups (A–L), top 2 + 8 best 3rd-placed advance to the Round of 32. Schema already accommodates; verify against the official FIFA source before the seed.

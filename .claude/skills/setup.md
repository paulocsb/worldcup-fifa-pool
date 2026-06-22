---
name: setup
description: |
  Complete first-time setup of the local development environment for the
  Bolão FIFA 2026 repo. Idempotent and safe to re-run. Drives the entire
  docs/SETUP.md flow autonomously, asking the user only for inputs that
  truly require human intervention (the API-Football key). On success,
  the user has a fully working local stack and can run `/dev` to start.
---

# /setup — First-time environment bootstrap

Mirrors `docs/SETUP.md` but executes it. Idempotent: re-running on a
configured machine should be a no-op with a clean exit.

## Pre-flight (block if missing)

Run in parallel:

```bash
node --version       # need 22+; if older, instruct user to install (fnm/nvm/asdf)
pnpm --version       # if missing: npm install -g pnpm
docker info          # Docker Desktop must be running
supabase --version   # if missing: brew install supabase/tap/supabase OR npm
```

For each missing prereq, print install instruction and STOP. Do NOT try
to auto-install Docker or Node — that's outside scope.

## Step-by-step

### 1. Install JS dependencies

```bash
pnpm install
```

If lockfile already satisfied → quick. If something is off → installs.

### 2. Start Supabase locally

```bash
supabase status 2>/dev/null
```

- If running and healthy → skip
- Otherwise → `supabase start` (first time pulls images, ~3 min)

### 3. Capture local credentials

```bash
supabase status --output env
```

Parse and remember `SUPABASE_URL` (should be `http://127.0.0.1:54321`) and
the `ANON_KEY`.

### 4. Frontend env (`.env.local`)

- If `.env.local` exists with values → leave alone, just confirm.
- If absent → create from `.env.example` and inject `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` from step 3.

### 5. API-Football key (the ONE thing requiring user input)

Check `supabase/functions/.env`:

- If file exists and `API_FOOTBALL_KEY` has a non-empty value → skip silently.
- If absent or empty → ask the user:
  > "Need an API-Football key. Sign up at <https://www.api-football.com>
  > (free tier works for local setup). Paste your key here:"

After receiving the key:
- Create/update `supabase/functions/.env` with `API_FOOTBALL_KEY=...`
- Preserve other vars (`API_FOOTBALL_LEAGUE_ID=1`, `API_FOOTBALL_SEASON=2026`)
- Run `supabase stop && supabase start` so edge runtime picks up the key.

If the user wants to skip API-Football (UI-only work):
- Leave it empty.
- Warn that edge functions will fail when invoked.

### 6. Fixtures sync (populate matches table)

Only if step 5 set an API-Football key:

```bash
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"
```

Wait ~30 seconds, then verify:

```bash
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select count(*) from public.matches;"
```

Expected ≥ 72 (group-stage minimum). If 0: surface the error from edge
function logs (`supabase functions logs sync-fixtures --limit 30`).

### 7. Build validation

```bash
pnpm typecheck && pnpm test && pnpm build
```

All must pass.

### 8. Success briefing

Print:

```
✅ Local environment ready.

URLs:
  App         http://localhost:5173/login?invite=amigos2026
  Supabase    http://127.0.0.1:54321
  Studio      http://127.0.0.1:54323
  Mail (Inbucket) http://127.0.0.1:54324

Seeded invite: amigos2026

Next: /dev to start the dev server.
```

## Failure handling

| Failure | Action |
|---|---|
| `supabase start` port conflict | Suggest `supabase stop --all` then retry |
| `pnpm install` lockfile drift | Suggest `rm -rf node_modules && pnpm install` |
| Edge function `API_FOOTBALL_KEY` 401 | Verify key on api-football.com dashboard |
| `psql` not found | Suggest `brew install libpq` on macOS; not strictly required, can also use the migration's `supabase db reset` |

Always end with a clear next action or unblock instruction.

## Output language

Mirror the user's language. Default pt-BR. Commands and env values stay
in English.

## Idempotency contract

Re-running `/setup` on a fully configured machine MUST:
- Touch zero files
- Print "✅ Already configured" + the briefing
- Take less than 5 seconds

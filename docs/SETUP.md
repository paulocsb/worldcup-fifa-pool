# Local Setup — From Scratch

This guide walks you through bringing up a fully local copy of the Bolão FIFA
2026 app. Assumes you have a clean machine and have never used Supabase
locally before.

**Estimated time**: ~30 minutes (first time), ~5 minutes thereafter.

---

## Prerequisites

Install these once on your machine:

| Tool | Why | Install |
|---|---|---|
| **Node 22+** | Vite 6 requires it | https://nodejs.org or via `fnm` / `nvm` |
| **pnpm** | Package manager | `npm install -g pnpm` |
| **Docker Desktop** | Supabase local runs in containers | https://www.docker.com/products/docker-desktop |
| **Supabase CLI** | Manage local DB + edge functions | https://supabase.com/docs/guides/cli |
| **psql** (optional) | Run manual SQL against local DB | bundled with PostgreSQL, or `brew install libpq` on macOS |

Verify versions:

```bash
node --version    # v22.x or later
pnpm --version    # 9.x or later
docker --version  # 24.x or later
supabase --version  # 1.x or later
```

---

## Clone and install

```bash
git clone <repo-url>
cd fifa-bolao
pnpm install
```

`pnpm install` will:
- Pull all JS dependencies into `node_modules/`
- Set up Husky-style hooks (if configured)
- Build TypeScript type stubs

---

## Start Supabase locally

```bash
supabase start
```

This launches a stack of Docker containers:
- Postgres (port 54322)
- API Gateway (port 54321)
- Studio (port 54323)
- Auth, Storage, Realtime, Edge runtime, etc.

First time takes ~3 minutes (pulling images). Subsequent starts: ~20 seconds.

When it's done, you'll see output like:

```
API URL:           http://127.0.0.1:54321
DB URL:            postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:        http://127.0.0.1:54323
JWT secret:        ...
anon key:          eyJhbGc... (your local anon key)
service_role key:  eyJhbGc... (your local service role key)
```

**Important**: these are local-only keys. Don't worry about exposing them.

---

## Configure environment variables

### Frontend (`.env.local`)

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste anon key from `supabase start` output>
NODE_VERSION=22
```

You can also run `supabase status --output env` and copy values from there.

### Edge functions (`supabase/functions/.env`)

The local edge functions need the API-Football key to fetch real data. You
have two options:

**Option A — Use real API-Football credentials** (recommended for full testing):
1. Sign up at https://www.api-football.com (free tier works for setup)
2. Copy your API key
3. Create the env file:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

4. Edit `supabase/functions/.env`:

```bash
API_FOOTBALL_KEY=<your-key>
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
```

**Option B — Skip API-Football** (work on UI only, no live data):

Leave `API_FOOTBALL_KEY=` empty. Edge functions will fail when invoked, but
the app will still run with whatever seed data the migrations provide.

After editing `.env` files, restart Supabase so edge functions pick up the new env:

```bash
supabase stop && supabase start
```

---

## Apply migrations and seed

Migrations run automatically on `supabase start`. If you want to reset
everything (wipe + reapply migrations + reseed):

```bash
supabase db reset
```

This will:
- Drop the entire local schema
- Re-apply all migrations in order (`supabase/migrations/*.sql`)
- Run seed scripts (48 teams, scoring_config, default invite `amigos2026`, etc.)

---

## Generate TypeScript types

After any migration change, regenerate the types so `src/types/db.ts` matches your schema:

```bash
supabase gen types typescript --local > src/types/db.ts
```

For first-time setup, this is already in sync — only re-run when you add or
change tables.

---

## Sync fixtures (populates the matches table)

If you provided an API-Football key in Option A above, populate the `matches`
table with the World Cup 2026 fixtures:

```bash
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"
```

After ~30 seconds, verify it worked:

```bash
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select count(*) from public.matches;"
```

Expected: **72** (just the group stage) or **104** (with knockouts) depending on when API-Football has fixtures.

---

## Run the dev server

```bash
pnpm dev
```

Open **http://localhost:5173/login?invite=amigos2026** in your browser.

The query string is important: without an invite, you'll see "Bolão privado".
The seed migration creates a default invite with code `amigos2026`.

---

## Sign up as a local user

1. On the login screen, enter your real email (the magic link is delivered to Supabase Inbucket, the local mail catcher).
2. Open Inbucket at **http://127.0.0.1:54324** in another tab.
3. Find the email titled "Confirm your signup" or similar.
4. Click the magic link.
5. You'll land on `/onboarding` — pick a name and an avatar.
6. After onboarding, you're in. The first signup is automatically promoted to admin.

---

## Real-device testing

Mobile UI matters. Test on your actual phone in the local network:

```bash
pnpm dev --host
```

Vite will print URLs accessible from the LAN. Open one of them on your iPhone
or Android. (Make sure your phone is on the same Wi-Fi as your computer.)

You can also install the local app as a PWA from your phone for full
mobile-first testing.

---

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `supabase start` fails with "port already in use" | A previous Supabase instance is still running, or another service is on the same port | `supabase stop --all` then `supabase start` |
| `docker: command not found` | Docker Desktop isn't running | Start Docker Desktop |
| `pnpm dev` errors about missing `VITE_SUPABASE_URL` | `.env.local` wasn't created | `cp .env.example .env.local` and fill it in |
| Login form says "Bolão privado" | URL is missing `?invite=amigos2026` | Append the query string |
| Magic link email never arrives | Looking in your real email instead of Inbucket | Open http://127.0.0.1:54324 |
| Edge function fails: "API_FOOTBALL_KEY missing" | env file not set or Supabase not restarted | Create `supabase/functions/.env`, restart Supabase |
| TypeScript errors about missing types from `db.ts` | Migrations changed without regenerating types | `supabase gen types typescript --local > src/types/db.ts` |

---

## What to do next

Once everything is running:

1. **Read** the `README.md` for the high-level overview
2. **Browse** `docs/PLAN.md` for the data model and feature scope
3. **Skim** `docs/SCORING.md` to understand how points work
4. **Pick** an issue labeled `good first issue` to start contributing
5. **Read** `CONTRIBUTING.md` and `docs/AI-WORKFLOW.md` for the contribution flow

Happy hacking! ⚽

---
disable-model-invocation: true
name: dev
description: |
  Start or refresh the local development stack: Supabase, Vite dev server,
  optional log tailing. Detects what's already running, surfaces port
  conflicts, and prints the URLs for app + Studio + Inbucket. Use at the
  start of a coding session (after /setup is one-time done).
---

# /dev — Local development stack

Bring up everything needed to develop locally. Detects current state so
running this multiple times is safe.

## Detection (run in parallel)

```bash
supabase status 2>/dev/null | head -5
lsof -i:5173 2>/dev/null | grep LISTEN
lsof -i:54321 2>/dev/null | grep LISTEN
```

## Bring up what's missing

### Supabase

If `supabase status` shows it's not running:

```bash
supabase start
```

Wait until healthy. First run takes longer (already covered in `/setup`).

### Vite dev server

If port 5173 is not listening, start it in background:

```bash
# Use run_in_background=true with the Bash tool
pnpm dev --host
```

The `--host` flag exposes to LAN so the user can test on a real iPhone.

## Verify health (sequential)

After starting:

```bash
curl -sf http://localhost:5173 -o /dev/null && echo "app ok" || echo "app down"
curl -sf http://127.0.0.1:54321/auth/v1/health -o /dev/null && echo "supabase ok" || echo "supabase down"
```

## Print briefing

Match what `/setup` ends with — same URLs, plus the LAN IP for mobile:

```bash
# Best effort LAN IP detection
ipconfig getifaddr en0 2>/dev/null || ip route get 1 2>/dev/null | awk '{print $7; exit}'
```

Final output structure:

```
🟢 Dev stack ready.

  App (this machine)    http://localhost:5173/login?invite=amigos2026
  App (LAN, for mobile) http://<lan-ip>:5173/login?invite=amigos2026
  Supabase API          http://127.0.0.1:54321
  Studio                http://127.0.0.1:54323
  Mail (Inbucket)       http://127.0.0.1:54324

  Dev server PID: <pid>  (stop: kill <pid>)
  Supabase:           supabase stop
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `supabase status` shows "stopped" but port 54321 is busy | Stale container | `supabase stop --all` |
| `pnpm dev` says port 5173 busy | Old dev process | `lsof -ti:5173 \| xargs kill` |
| Browser shows "Bolão privado" | URL missing `?invite=amigos2026` | Use the URLs above as-is |
| Magic link email not arriving | Looking in real inbox | Open Inbucket at http://127.0.0.1:54324 |

## Output language

Mirror the user. Default pt-BR. URLs and commands stay in English.

## Not in scope

- Production deploys — see `pnpm run deploy` or `/ship` for the workflow
- Migration application — `/setup` handles initial; for changes use the
  `supabase` specialized agent

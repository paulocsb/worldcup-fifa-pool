---
disable-model-invocation: true
name: security-sweep
description: |
  Comprehensive security audit of the app: RLS coverage, leaked secrets, auth
  flows, OWASP-style checks. Use periodically (before big releases, before
  onboarding many new friends, or after sensitive changes to policies/auth).
---

# /security-sweep — Security audit

Systematic sweep of the app's security boundaries. Doesn't replace a formal
review, but ensures the most common mistakes were checked.

## How to run

Without args: runs the full audit (all 6 dimensions).
With arg `<dim>`: runs only one (`rls`, `secrets`, `auth`, `client-writes`, `headers`, `deps`).

## 6 dimensions

### 1. RLS coverage

Every `public.*` table should have:
- `enable row level security` enabled
- At least 1 `select` policy AND write policies (`insert`/`update`/`delete`) with appropriate restriction

```sql
-- Tables WITHOUT RLS enabled (red 🔴)
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and tablename not in (
    select c.relname
    from pg_class c
    where c.relrowsecurity = true
  );

-- Tables WITH RLS enabled but NO policies (red 🔴)
select t.tablename
from pg_tables t
left join pg_policies p on p.tablename = t.tablename and p.schemaname = t.schemaname
where t.schemaname = 'public'
group by t.tablename
having count(p.policyname) = 0;

-- Policy map per table (informational)
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected: matches/teams/scores → public SELECT (authenticated); restricted writes. predictions/group_predictions/tournament_predictions → own SELECT + public post-lock; writes only own pre-lock. profiles → authenticated SELECT; own UPDATE. invites → admin SELECT/INSERT.

### 2. Secrets leaked in code

```bash
# Search for common key patterns in versioned files
git grep -E "(SUPABASE_SERVICE_ROLE_KEY|sk_live_|api_key|API_FOOTBALL_KEY)" -- '*.ts' '*.tsx' '*.sql' '*.json' ':!.env.example' ':!*.md'
```

**Blocks commit** if found:
- Service role key (NEVER in the client; only `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` in edge functions).
- API-Football key outside `supabase/functions/.env` (not versioned).
- Private DiceBear styles, Resend tokens, etc.

Also verify:
```bash
# .env files versioned?
git ls-files | grep -E "(\.env$|\.env\.local|\.env\.production)" | grep -v ".env.example"
```

Expected: empty. Only `.env.example` should be versioned.

### 3. Auth flows

- Magic link working with Resend SMTP? (Dashboard → Auth → SMTP)
- Site URL + Redirect URLs point to production domain (not localhost)?
- Inactivity Timeout and Session Time-box disabled (per CLAUDE.md objective: "session never expires")?
- JWT expiry = 24h (`exp` claim)?
- Refresh token rotation enabled?

Check in the SQL editor:
```sql
-- (no direct query — check on the dashboard Auth → Settings)
```

### 4. Client-side writes vs server-only

The client should NEVER write to:
- `matches`, `teams`, `scores`, `scoring_config`, `_http_response`, `cron.job`, `vault.*`

Search:
```bash
git grep -E "(from 'matches'|\.from\(.teams\.|\.from\('scores'\)|\.from\('scoring_config'\))" src/ | grep -v "// allowed:"
```

Expected: empty. Every protected table is only touched via Edge Functions.

### 5. Security headers

- Cloudflare Pages: has CSP, X-Frame-Options, etc.?
- Service worker properly configured (doesn't bypass auth)?
- CORS in Edge Functions restricts origin to the production domain?

```bash
# In supabase/functions/*/index.ts, look for Access-Control-Allow-Origin: *
grep -rn "Access-Control-Allow-Origin" supabase/functions/
```

Wildcards (`*`) are only OK if the function is completely public (no auth).

### 6. Dependencies (known vulns)

```bash
# Audit deps
pnpm audit --prod

# Alternative
pnpm dlx npm-audit-html
```

Expected: 0 high/critical. If any, list + suggest upgrade.

## Report format

```
# Security Sweep — DATE

## Summary
✅ 4 / 6 dimensions OK
⚠️ 1 attention
🔴 1 critical problem

## Details

### 1. RLS coverage — ✅
All 9 tables in public.* have RLS + policies.

### 2. Secrets — ⚠️
Found `API_FOOTBALL_KEY=xyz` in supabase/functions/.env.example (expected empty).
**Action**: clear value, leave `API_FOOTBALL_KEY=` blank.

### 3. Auth flows — ✅
JWT 24h, Resend SMTP active, redirects pointing at production.

### 4. Client-side writes — 🔴
src/routes/admin.tsx:42 writes to `scoring_config` directly via the supabase client.
It should go through an edge function.
**Action**: create edge function `admin-update-config`, move the logic.

### 5. Headers — ✅
CORS restricted to the production domain (set in each edge function via env-driven origin).

### 6. Dependencies — ✅
pnpm audit: 0 vulns.
```

## Output

- **Language**: mirror the user (default pt-BR).
- **Tone**: rigorous, without softening critical issues.
- **End with** a prioritized action list. 🔴 items = blockers for the next release.

# Production Deploy

Selected stack:

| Layer | Service | Cost |
|---|---|---|
| Frontend | **Cloudflare Pages** | free |
| Backend/DB | **Supabase managed** (us-east-1) | free (free tier) |
| Email (magic link) | **Resend** | free (10k emails/month) |
| DNS + SSL | **Cloudflare** | free |
| Live data | **API-Football Pro** | $19/month |
| CI | **Cloudflare Pages auto-deploy** | free |

**Total monthly cost: $19** (API-Football only).

---

## Phase 0 · Pre-deploy

Clean up the repo before going live.

```bash
# 1. Confirm .env*.local is NOT in git
git status --ignored | grep -i env

# 2. Confirm credentials are in .env.example with EMPTY values
cat .env.example
cat supabase/functions/.env.example

# 3. Clean build
pnpm typecheck && pnpm build
```

**Checklist** before proceeding:
- [ ] `.gitignore` ignores `.env`, `.env.local`, `supabase/.env*`, `supabase/functions/.env`, `supabase/functions/.env.local`
- [ ] `supabase/.temp/` ignored
- [ ] `dist/` ignored
- [ ] `node_modules/` ignored
- [ ] No hardcoded secrets in code (search for `eyJhbGc...`)

---

## Phase 1 · GitHub (private repo)

1. **Create repo** at https://github.com/new
   - Visibility: **Private** (you can switch to public later — see CONTRIBUTING.md)
   - Don't initialize with README/gitignore/license (we already have them locally)

2. **Connect local to remote**:
   ```bash
   cd path/to/fifa-bolao
   git init  # if not yet initialized
   git add .
   git commit -m "feat: initial commit — FIFA bolão app"
   git branch -M main
   git remote add origin git@github.com:<your-user>/<repo>.git
   git push -u origin main
   ```

3. **Verify branch `main`** is protected (optional, settings → branches)

---

## Phase 2 · Supabase production

### 2.1 Create the project

1. https://supabase.com/dashboard → **New project**
2. Configure:
   - **Name**: `fifa-bolao`
   - **Database password**: generate and store in a password manager
   - **Region**: **East US (North Virginia)** `us-east-1`
   - Plan: Free
3. Wait ~2 min for provisioning
4. In **Settings → API**, note down:
   - `Project URL` (https://xxx.supabase.co)
   - `anon` key (public, ships to frontend)
   - `service_role` key (secret, server-only)

### 2.2 Link the CLI to the project

```bash
# Login to the CLI (opens browser)
supabase login

# Link to the remote project
supabase link --project-ref <PROJECT_ID>
# (project ref is in the URL: supabase.com/dashboard/project/XXXXXX)
```

### 2.3 Push the migrations

```bash
# Applies all migrations in supabase/migrations/ to the remote
supabase db push
```

It will show the list of 21+ migrations to be applied. Confirm.

### 2.4 Deploy the edge functions

```bash
supabase functions deploy sync-fixtures
supabase functions deploy sync-live
supabase functions deploy compute-scores
supabase functions deploy sync-match-detail
```

### 2.5 Edge function secrets

```bash
# Uploads the API_FOOTBALL_* vars to the functions' env in prod
supabase secrets set --env-file supabase/functions/.env
```

Verify in the dashboard: Settings → Edge Functions → Secrets.

### 2.6 Update vault to point at the production endpoint

The `20260616000004_scheduling.sql` migration seeds vault with
`host.docker.internal:54321` (local). In production, it needs to point at the
remote endpoint.

In the **SQL Editor on the dashboard**, run:

```sql
-- Replace 'xxx' with your Supabase project subdomain
select vault.update_secret(id, 'https://xxx.supabase.co/functions/v1', name)
from vault.secrets where name = 'fifa.edge_url';

-- Replace with your real service_role key (Settings → API)
select vault.update_secret(id, 'eyJhbG...SERVICE_ROLE_KEY_HERE...', name)
from vault.secrets where name = 'fifa.service_role';

-- Confirm
select name, description from vault.decrypted_secrets where name like 'fifa.%';
```

### 2.7 Enable extensions

Dashboard → **Database → Extensions**, enable (if not already):
- ✅ `pg_cron`
- ✅ `pg_net`
- ✅ `supabase_vault`

### 2.8 Auth — Site URL and redirects

(We come back here after configuring the domain in Phase 4.)

For now, leave as-is. After Phase 4 we return.

---

## Phase 3 · Resend (SMTP)

### 3.1 Create an account

1. https://resend.com → Sign up (free)
2. **Domains → Add Domain** → enter `yourdomain.com`
3. Resend shows 3 DNS records (MX, SPF/TXT, DKIM/TXT)

### 3.2 DNS at Cloudflare

1. Cloudflare dashboard → your domain → **DNS**
2. Add the 3 records exactly as Resend showed
   - **MX** record (proxy OFF — DNS only)
   - **TXT** SPF
   - **TXT** DKIM
3. Wait for verification (1–5 min). Status in Resend turns "verified".

### 3.3 Create an API key in Resend

1. Resend → **API Keys → Create API Key**
2. Name: "Supabase Production"
3. Permission: Sending access
4. Save the `re_xxx` (only shown once)

### 3.4 Configure in Supabase

Supabase dashboard → **Project Settings → Authentication → SMTP Settings**:

| Field | Value |
|---|---|
| Enable Custom SMTP | ✅ |
| Sender email | `bolao@yourdomain.com` |
| Sender name | `Bolão FIFA 2026` |
| Host | `smtp.resend.com` |
| Port number | `587` |
| Min interval | `60` |
| Username | `resend` |
| Password | (the `re_xxx` API key from step 3.3) |

**Save**.

### 3.5 Customize the magic-link template

Dashboard → **Authentication → Email Templates → Magic Link**.

Suggested template in pt-BR (the user-facing language):

```html
<h2>Entre no Bolão FIFA 2026</h2>
<p>Clica no botão abaixo para entrar no app sem senha:</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#1FAB6E;color:#0F2818;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-family:Saira Condensed,Inter,sans-serif;text-transform:uppercase;letter-spacing:1px;">
    Entrar no bolão
  </a>
</p>
<p style="color:#666;font-size:12px;margin-top:24px">
  Se você não solicitou, ignore este email.<br />
  O link expira em 1 hora.
</p>
```

**Save changes**.

---

## Phase 4 · Cloudflare Pages

### 4.1 Connect GitHub

1. Cloudflare dashboard → **Workers & Pages → Create application → Pages**
2. **Connect to Git** → authorize → choose your `fifa-bolao` repo
3. **Production branch**: `main`

### 4.2 Build settings

| Field | Value |
|---|---|
| Framework preset | Vite |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `22` (Environment variables → `NODE_VERSION=22`) |

### 4.3 Environment variables (Production)

Under **Settings → Environment variables → Production**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (anon key from the Supabase dashboard) |
| `NODE_VERSION` | `22` |

### 4.4 First deploy

**Save and deploy**. Wait for the build (~2–3 min). Generates a `xxx.pages.dev` URL.

Open the URL — the app should load (you'll see "Bolão privado" because there's no invite in the URL yet).

### 4.5 Custom domain (subdomain)

1. In the Pages project → **Custom domains → Set up a custom domain**
2. Type `bolao.yourdomain.com` (or whatever subdomain you choose)
3. Cloudflare **automatically creates** the CNAME in DNS (because the domain is already at Cloudflare)
4. SSL provisioned in ~1 min

---

## Phase 5 · Closing the loop (Auth + URLs)

Now that you have a final domain:

1. **Supabase dashboard → Authentication → URL Configuration**:
   - **Site URL**: `https://bolao.yourdomain.com`
   - **Redirect URLs** (allow list):
     - `https://bolao.yourdomain.com/auth/callback`
     - `https://bolao.yourdomain.com/**`
   - Save

2. **Resend**: verify that `bolao@yourdomain.com` is authorized (configured in Phase 3.4)

---

## Phase 6 · Production smoke test

```sql
-- In the Supabase SQL Editor, create a test invite
insert into public.invites (code, description, max_uses)
values ('teste_deploy', 'Smoke test', 1);
```

1. Open `https://bolao.yourdomain.com/login` → should show **"Bolão privado"**
2. Open `https://bolao.yourdomain.com/login?invite=teste_deploy` → form appears
3. Enter your real email → send the magic link
4. Check inbox (not spam!) — arrives from `bolao@yourdomain.com`
5. Click **Entrar no bolão**
6. Redirect → `/auth/callback` → `/onboarding`
7. Enter name + pick avatar → **Entrar no bolão**
8. You land on Home, **profile created**, **invite consumed** (uses_count=1)
9. **You become admin** automatically (first signup via trigger)
10. **Profile → Admin → Manage invites** appears

### 6.1 Verify the backend pipeline

In the SQL Editor:

```sql
-- Is cron running?
select jobname, schedule, active from cron.job;

-- Latest executions (should have recent successes)
select jobname, start_time, status from cron.job_run_details
order by start_time desc limit 5;

-- Is pg_net responding?
select status_code, content::text from net._http_response
order by created desc limit 3;

-- Matches populated? (if sync-fixtures hasn't run yet, invoke it)
select public.invoke_edge_function('sync-fixtures');
-- wait 30s, then:
select count(*) from public.matches;
-- expected: 72 (group stage alone) or 104 (full tournament)
```

---

## Phase 7 · Open to friends

1. `/profile → Admin → Manage invites`
2. **Create invite**:
   - Code: `amigos2026` (or any memorable code)
   - Description: "Friends group · WhatsApp"
   - Uses: **∞**
   - Expires: **Never**
3. The "Link" button copies: `https://bolao.yourdomain.com/login?invite=amigos2026`
4. Share in WhatsApp

Each friend:
- Clicks → creates an account with magic link → lands in onboarding → joins the pool

---

## Free-tier limits (reference)

| Service | Free limit | Our estimated usage |
|---|---|---|
| Supabase DB | 500 MB | ~10 MB for a friend group |
| Supabase auth users | 50k MAU | ~20 friends |
| Supabase edge functions | 500k invocations/month | ~50k/month (sync every 1min × 30 days) |
| Supabase egress | 5 GB/month | ~1 GB comfortably |
| Cloudflare Pages | unlimited bandwidth | n/a |
| Resend | 10k emails/month | ~50/month |
| API-Football | 7,500 reqs/day (Pro) | ~1k/day |

Plenty of headroom. The free tier handles it easily.

---

## Ongoing maintenance

| What | Where | Frequency |
|---|---|---|
| Error logs | Supabase → Logs → Edge Functions | weekly |
| Cron status | SQL: `cron.job_run_details` | when something seems off |
| API-Football usage | api-football.com dashboard | monthly |
| Backups | Supabase auto-daily (free 7-day retention) | n/a |

---

## Risks & rollback

| Scenario | Mitigation |
|---|---|
| **Pages build fails** | Pages has a "Deployments" tab — 1-click rollback to the previous build |
| **Bad migration in prod** | Always test locally first. In prod use `supabase db push --dry-run` first |
| **Cron doesn't run** | Re-apply migration `20260616000004_scheduling.sql` + verify vault secrets are updated |
| **DB full (500MB)** | Upgrade to Pro tier ($25/month) or clean old data |
| **API-Football down** | sync-live fails silently; matches stay in their last-known state until the API returns |
| **Domain fails** | Cloudflare DNS is stable; fallback is the `xxx.pages.dev` URL keeps working |

---

## Suggested commits for this plan

Before deploy:
```bash
git add docs/DEPLOY.md
git commit -m "docs: production deploy plan"
git push origin main
```

Each subsequent change in prod → commit + push → Pages auto-redeploys.

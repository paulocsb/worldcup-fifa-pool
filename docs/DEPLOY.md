# Deploy — Produção

Stack escolhida:

| Camada | Serviço | Custo |
|---|---|---|
| Frontend | **Cloudflare Pages** | grátis |
| Backend/DB | **Supabase managed** (us-east-1) | grátis (free tier) |
| Email (magic link) | **Resend** | grátis (10k emails/mês) |
| DNS + SSL | **Cloudflare** | grátis |
| Dados ao vivo | **API-Football Pro** | $19/mês (já pago) |
| CI | **Cloudflare Pages auto-deploy** | grátis |

**Custo mensal total: $19** (apenas API-Football).

---

## Fase 0 · Pré-deploy

Limpeza do repo antes de subir.

```bash
# 1. Conferir que .env*.local NÃO está no git
git status --ignored | grep -i env

# 2. Conferir que credenciais estão em .env.example com valores VAZIOS
cat .env.example
cat supabase/functions/.env.example

# 3. Build limpo
pnpm typecheck && pnpm build
```

**Checklist** antes de prosseguir:
- [ ] `.gitignore` ignora `.env`, `.env.local`, `supabase/.env*`, `supabase/functions/.env`, `supabase/functions/.env.local`
- [ ] `supabase/.temp/` ignorado
- [ ] `dist/` ignorado
- [ ] `node_modules/` ignorado
- [ ] Nenhum segredo hardcoded no código (procurar por `eyJhbGc...`)

---

## Fase 1 · GitHub (repo privado)

1. **Criar repo** em https://github.com/new
   - Visibilidade: **Private**
   - Não inicializar com README/gitignore/license (já temos no local)

2. **Conectar local ao remote**:
   ```bash
   cd /Users/paulocsb/Workspace/dev/fifa-bolao
   git init  # se ainda não inicializado
   git add .
   git commit -m "feat: initial commit — FIFA bolão app"
   git branch -M main
   git remote add origin git@github.com:<seu-user>/<repo>.git
   git push -u origin main
   ```

3. **Verificar branch `main`** está protegida (opcional, settings → branches)

---

## Fase 2 · Supabase produção

### 2.1 Criar projeto

1. https://supabase.com/dashboard → **New project**
2. Configurar:
   - **Name**: `fifa-bolao`
   - **Database password**: gerar e guardar em password manager
   - **Region**: **East US (North Virginia)** `us-east-1`
   - Plan: Free
3. Aguardar ~2 min provisionar
4. Em **Settings → API**, anotar:
   - `Project URL` (https://xxx.supabase.co)
   - `anon` key (pública, vai pro frontend)
   - `service_role` key (secreta, só backend)

### 2.2 Linkar CLI ao projeto

```bash
# Login na CLI (abre browser)
supabase login

# Link ao projeto remoto
supabase link --project-ref <ID_DO_PROJETO>
# (project ref está na URL: supabase.com/dashboard/project/XXXXXX)
```

### 2.3 Push das migrations

```bash
# Aplica todas as migrations do supabase/migrations/ no remoto
supabase db push
```

Vai mostrar a lista de 21+ migrations a serem aplicadas. Confirmar.

### 2.4 Deploy das edge functions

```bash
supabase functions deploy sync-fixtures
supabase functions deploy sync-live
supabase functions deploy compute-scores
supabase functions deploy sync-match-detail
```

### 2.5 Secrets das edge functions

```bash
# Sobe as 3 vars (API_FOOTBALL_*) pro env das functions em prod
supabase secrets set --env-file supabase/functions/.env
```

Verificar no dashboard: Settings → Edge Functions → Secrets.

### 2.6 Atualizar vault para apontar pro endpoint de produção

A migration `20260616000004_scheduling.sql` seeda vault com `host.docker.internal:54321` (local). Em prod, precisa apontar pro endpoint remoto.

No **SQL Editor do dashboard**, executar:

```sql
-- Substituir 'xxx' pelo subdomínio do projeto Supabase
update vault.secrets
set secret = 'https://xxx.supabase.co/functions/v1'
where name = 'fifa.edge_url';

-- Substituir pelo service_role key real (Settings → API)
update vault.secrets
set secret = 'eyJhbG...SERVICE_ROLE_KEY_AQUI...'
where name = 'fifa.service_role';

-- Confirmar
select name, description from vault.decrypted_secrets where name like 'fifa.%';
```

### 2.7 Habilitar extensions

Dashboard → **Database → Extensions**, habilitar (se não estiverem):
- ✅ `pg_cron`
- ✅ `pg_net`
- ✅ `supabase_vault`

### 2.8 Auth — Site URL e redirects

(Vamos voltar aqui depois de configurar o domínio na Fase 4)

Por enquanto, deixar como está. Após a Fase 4 voltamos.

---

## Fase 3 · Resend (SMTP)

### 3.1 Criar conta

1. https://resend.com → Sign up (free)
2. **Domains → Add Domain** → digitar `seudominio.com`
3. Resend mostra 3 DNS records (MX, SPF/TXT, DKIM/TXT)

### 3.2 DNS no Cloudflare

1. Cloudflare dashboard → seu domínio → **DNS**
2. Adicionar os 3 records exatamente como o Resend mostrou
   - **MX** record (proxy OFF — DNS only)
   - **TXT** SPF
   - **TXT** DKIM
3. Esperar verificação (1–5 min). Status no Resend vira "verified".

### 3.3 Criar API key no Resend

1. Resend → **API Keys → Create API Key**
2. Nome: "Supabase Production"
3. Permission: Sending access
4. Anotar o `re_xxx` (só aparece uma vez)

### 3.4 Configurar no Supabase

Dashboard Supabase → **Project Settings → Authentication → SMTP Settings**:

| Campo | Valor |
|---|---|
| Enable Custom SMTP | ✅ |
| Sender email | `bolao@seudominio.com` |
| Sender name | `Bolão FIFA 2026` |
| Host | `smtp.resend.com` |
| Port number | `587` |
| Min interval | `60` |
| Username | `resend` |
| Password | (a API key `re_xxx` do passo 3.3) |

**Save**.

### 3.5 Customizar template do magic link

Dashboard → **Authentication → Email Templates → Magic Link**.

Sugestão em PT-BR:

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

## Fase 4 · Cloudflare Pages

### 4.1 Conectar GitHub

1. Cloudflare dashboard → **Workers & Pages → Create application → Pages**
2. **Connect to Git** → autorizar → escolher seu repo `fifa-bolao`
3. **Production branch**: `main`

### 4.2 Build settings

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` (Environment variables → `NODE_VERSION=20`) |

### 4.3 Environment variables (Production)

Em **Settings → Environment variables → Production**:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (anon key do dashboard Supabase) |
| `NODE_VERSION` | `20` |

### 4.4 Primeiro deploy

**Save and deploy**. Aguardar build (~2–3 min). Vai gerar URL `xxx.pages.dev`.

Acessar a URL — deve carregar o app (vai ver "Bolão privado" porque ainda não tem invite na URL).

### 4.5 Custom domain (subdomínio)

1. No projeto Pages → **Custom domains → Set up a custom domain**
2. Digitar `bolao.seudominio.com` (ou o subdomínio que você escolher)
3. Cloudflare **cria automaticamente** o CNAME no DNS (porque o domínio já está no Cloudflare)
4. SSL provisionado em ~1 min

---

## Fase 5 · Fechando o loop (Auth + URLs)

Agora que tem domínio final:

1. **Supabase dashboard → Authentication → URL Configuration**:
   - **Site URL**: `https://bolao.seudominio.com`
   - **Redirect URLs** (allow list):
     - `https://bolao.seudominio.com/auth/callback`
     - `https://bolao.seudominio.com/**`
   - Save

2. **Resend**: verificar que `bolao@seudominio.com` está autorizado (foi configurado na Fase 3.4)

---

## Fase 6 · Smoke test em produção

```sql
-- No SQL Editor do Supabase, criar invite de teste
insert into public.invites (code, description, max_uses)
values ('teste_deploy', 'Smoke test', 1);
```

1. Abrir `https://bolao.seudominio.com/login` → deve mostrar **"Bolão privado"**
2. Abrir `https://bolao.seudominio.com/login?invite=teste_deploy` → form aparece
3. Inserir seu email real → enviar magic link
4. Checar inbox (não spam!) — chega de `bolao@seudominio.com`
5. Clicar no botão **Entrar no bolão**
6. Redirect → `/auth/callback` → `/onboarding`
7. Preencher nome + escolher avatar → **Entrar no bolão**
8. Você cai na Home, **profile criado**, **invite consumido** (uses_count=1)
9. **Você vira admin** automaticamente (primeiro signup via trigger)
10. **Profile → Admin → Gerenciar convites** aparece

### 6.1 Verificar pipeline backend

No SQL Editor:

```sql
-- Cron rodando?
select jobname, schedule, active from cron.job;

-- Últimas execuções (deve ter sucessos recentes)
select jobname, start_time, status from cron.job_run_details
order by start_time desc limit 5;

-- pg_net respondendo?
select status_code, content::text from net._http_response
order by created desc limit 3;

-- Matches populadas? (caso ainda não tenha rodado o sync-fixtures, invocar)
select public.invoke_edge_function('sync-fixtures');
-- esperar 30s, depois:
select count(*) from public.matches;
-- esperado: 72
```

---

## Fase 7 · Abrir pros amigos

1. `/profile → Admin → Gerenciar convites`
2. **Criar invite**:
   - Código: `amigos2026` (ou outro memorável)
   - Descrição: "Grupo de amigos · WhatsApp"
   - Usos: **∞**
   - Expira: **Nunca**
3. Botão "Link" copia: `https://bolao.seudominio.com/login?invite=amigos2026`
4. Compartilhar no WhatsApp

Cada amigo:
- Clica → cria conta com magic link → cai no onboarding → entra no bolão

---

## Limites do free tier (referência)

| Serviço | Limite free | Nosso uso estimado |
|---|---|---|
| Supabase DB | 500 MB | ~10 MB pra um grupo de amigos |
| Supabase auth users | 50k MAU | ~20 amigos |
| Supabase edge functions | 500k invocations/mês | ~50k/mês (sync a cada 1min × 30 dias) |
| Supabase egress | 5 GB/mês | ~1 GB confortável |
| Cloudflare Pages | unlimited bandwidth | n/a |
| Resend | 10k emails/mês | ~50/mês |
| API-Football | 7,500 reqs/dia (Pro) | ~1k/dia |

Sobra muito espaço. Free tier dá conta sem stress.

---

## Manutenção contínua

| O quê | Onde | Frequência |
|---|---|---|
| Logs de erro | Supabase → Logs → Edge Functions | semanal |
| Status do cron | SQL: `cron.job_run_details` | quando suspeitar |
| Uso da API-Football | dashboard api-football.com | mensal |
| Backups | Supabase faz daily automáticos (free 7 dias retention) | n/a |

---

## Riscos & rollback

| Cenário | Mitigação |
|---|---|
| **Build do Pages falha** | Pages tem "Deployments" tab — rollback pra build anterior em 1 clique |
| **Migration ruim em prod** | Sempre testar local primeiro. Em prod usar `supabase db push --dry-run` antes |
| **Cron não roda** | Re-aplicar migration `20260616000004_scheduling.sql` + verificar vault secrets atualizados |
| **DB cheio (500MB)** | Upgrade pro Pro tier ($25/mês) ou limpar dados antigos |
| **API-Football fora** | Sync-live falha silenciosamente; partidas continuam no estado prévio até API voltar |
| **Domínio falha** | Cloudflare DNS é estável; fallback é `xxx.pages.dev` continuar funcionando |

---

## Commits desse plano (sugestão)

Antes do deploy:
```bash
git add docs/DEPLOY.md
git commit -m "docs: plano de deploy em produção"
git push origin main
```

Cada subsequente change em prod → commit + push → Pages re-deploya automaticamente.

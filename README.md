# Bolão FIFA 2026

App mobile-first de bolão da Copa do Mundo FIFA 2026 entre amigos. React + Vite + TypeScript no front, Supabase no back, dados ao vivo via API-Football.

> Documentação detalhada em `docs/` — comece pelo [PLAN.md](docs/PLAN.md) (escopo) e [DEPLOY.md](docs/DEPLOY.md) (deploy em produção).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Estado servidor | TanStack Query + Supabase Realtime |
| Backend | Supabase (Postgres, Auth, Edge Functions, pg_cron) |
| Auth | Magic link (email) + sistema de convites |
| Dados ao vivo | API-Football (api-sports.io) |
| Hosting (prod) | Cloudflare Pages + Supabase managed + Resend (SMTP) |
| PWA | vite-plugin-pwa (offline-friendly, installable) |

## Funcionalidades

- **Auth por convite**: acesso só por link `/login?invite=CODE` (admin gera no painel)
- **Palpites de placar**: por partida, com lock 5 min antes do kickoff
- **Palpite de grupo**: ordem final dos 4 times (lock 5 min antes da MD3)
- **Palpite de torneio**: campeão / vice / 3º (lock no fim da fase de grupos)
- **Scoring automático**: cron a cada 1 min sincroniza placares e recompõe pontos
- **Ranking realtime**: atualiza assim que jogos terminam, sem refresh
- **Modo rápido**: tela tipo Tinder pra palpitar muitos jogos em sequência com atalhos (1-0, 2-1, etc)
- **Classificação dos grupos**: tabela ao vivo dos 12 grupos
- **Detalhes da partida**: escalações, eventos (gols, cartões, subs) e estatísticas via API-Football
- **PWA**: instalável no celular como app nativo, funciona offline para read-only
- **Dark mode**: padrão, com toggle no perfil

## Stack visual (sistema de design)

- **Tipografia**: Saira Condensed Black (display) + Noto Sans (body) — secundário oficial FIFA
- **Cores**: paleta arco-íris contextual seguindo o brand FIFA 2026
  - 12 cores por grupo (A–L)
  - 7 cores por fase (group → final amarelo)
  - 3 posições cerimoniais (gold/silver/bronze)
- **Background contextual**: muda por seção (group-stage verde, knockouts roxo, final amarelo)
- **Logo FIFA 2026**: portrait + horizontal + light/dark variants, swap automático por tema

## Setup local

Pré-requisitos: Node 18+, pnpm, Docker Desktop, Supabase CLI.

```bash
# 1. Instalar deps
pnpm install

# 2. Subir Supabase local (Postgres + Auth + Storage + Edge runtime)
supabase start

# 3. Aplicar migrations + seed
#    (já aplicadas automaticamente no `supabase start`; rodar reset se quiser limpar)
# supabase db reset

# 4. Configurar env do frontend
cp .env.example .env.local
#    Pegar VITE_SUPABASE_URL e ANON_KEY de `supabase status --output env`

# 5. Configurar env das edge functions (API-Football)
cp supabase/functions/.env.example supabase/functions/.env
#    Editar e adicionar API_FOOTBALL_KEY (https://www.api-football.com)

# 6. Sync inicial dos jogos (popula tabela matches)
#    Antes precisa reiniciar Supabase pra ele carregar o .env das functions:
supabase stop && supabase start
#    Depois:
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"

# 7. Dev server
pnpm dev
#    Abre http://localhost:5173/login?invite=amigos2026
#    (invite 'amigos2026' é seedado pela migration)
```

## Comandos comuns

```bash
pnpm dev            # vite dev server
pnpm build          # production build (gera dist/)
pnpm preview        # serve dist/ em produção local (testar PWA)
pnpm typecheck      # tsc -b --noEmit
pnpm lint           # eslint

supabase status                  # URLs e chaves locais
supabase functions logs <name>   # logs de uma edge function
supabase db reset                # wipe + reaplica migrations + seed
supabase db push                 # push migrations pra projeto remoto

# Trigger sync manual (durante dev)
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -c "select public.invoke_edge_function('sync-fixtures');"
```

## Estrutura

```
.
├── public/                    # static (FIFA logos, PWA icons)
├── src/
│   ├── components/            # UI components (MatchCard, PageHeader, etc.)
│   │   └── match/             # specific to /matches/:id (Events, Lineups, Stats)
│   ├── hooks/                 # TanStack Query hooks + helpers
│   ├── routes/                # 1 file = 1 rota; nested em predictions/
│   ├── lib/                   # supabase client, scoring, format, groupColors, dicebear
│   └── types/db.ts            # types gerados via supabase gen types
├── supabase/
│   ├── migrations/            # schema versionado
│   └── functions/             # edge functions (Deno)
│       ├── _shared/           # api-football client, scoring lib, aliases
│       ├── sync-fixtures/
│       ├── sync-live/
│       ├── sync-match-detail/
│       └── compute-scores/
├── docs/
│   ├── PLAN.md                # plano original e escopo
│   ├── FIFA-2026-FORMAT.md    # regras oficiais do torneio (grupos, fases, desempates)
│   ├── REBRAND.md             # sistema de design
│   └── DEPLOY.md              # plano de deploy em produção
└── CLAUDE.md                  # diretrizes pra agentes (Claude Code)
```

## Edge Functions

| Função | Quando roda | Propósito |
|---|---|---|
| `sync-fixtures` | cron a cada 6h | upsert de todas fixtures + teams da Copa |
| `sync-live` | cron a cada 1 min | placar + minuto + status; dispara compute-scores em transições |
| `compute-scores` | invocada por sync-live (ou manual) | aplica scoring nas predictions de matches finalizadas |
| `sync-match-detail` | invocada do front quando abre /matches/:id | escalações, eventos, stats (TTL 60s pra live) |

Todas usam o cliente API-Football compartilhado em `supabase/functions/_shared/api-football.ts`.

## Sistema de scoring

Regras configuráveis em `public.scoring_config` (DB):

- **Por partida**: 10 placar exato · 5 resultado · 2 saldo correto
- **Por grupo**: 5 (1º) · 5 (2º) · 3 (3º) · 2 (4º) · +3 bônus por classificado nos 32-avos
- **Torneio**: 30 campeão · 15 vice · 10 terceiro lugar
- **Cutoff**: MD1 da fase de grupos não pontua (`group_matchday_start = 2`)
- **Lock**: 5 min antes do kickoff individual; grupo trava antes da MD3

Lógica em `src/lib/scoring.ts` (cliente) espelhada em `supabase/functions/compute-scores/index.ts` (servidor — fonte da verdade).

## Sistema de convites

- Tabela `public.invites` com `code`, `description`, `max_uses`, `expires_at`, `uses_count`
- Trigger `profiles_consume_invite` valida e consome no INSERT em `profiles`
- Primeiro signup vira admin automaticamente
- Admin gerencia via `/invites` (UI), criando códigos personalizados ou aleatórios

## Deploy em produção

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md) — passo a passo executável, ~1h45 do zero ao funcionando.

Stack escolhida: **Cloudflare Pages + Supabase managed + Resend SMTP + Cloudflare DNS**.

Custo: $19/mês (apenas API-Football Pro).

## Licença

Projeto pessoal entre amigos. Não distribuível comercialmente — o brand FIFA 2026 e os logos são propriedade da FIFA.

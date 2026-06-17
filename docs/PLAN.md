# Bolão FIFA 2026 — Plano de Implementação

## Context

Construir um app de bolão entre amigos para a Copa do Mundo FIFA 2026. **Urgência alta**: hoje é 2026-06-15 e a Copa começou em 11/06 — alguns jogos da fase de grupos já aconteceram. Decisão: esses jogos passados são bloqueados (ninguém pontua) e o bolão começa a valer das próximas partidas em diante, garantindo equidade entre todos os participantes.

O app é mobile-first (maioria acessará via celular), com auth via magic link, palpites travados 5 minutos antes do apito inicial, ranking ao vivo e sincronização com dados oficiais da Copa. Escopo é um único bolão (o grupo de amigos do usuário) — sem suporte multi-bolão no MVP.

## Stack

- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, TanStack Query, React Router
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage)
- **Auth**: Magic link (Supabase Auth)
- **Dados ao vivo**: API-Football (api-sports.io) — fixtures, lineups, eventos, stats
- **Avatares**: DiceBear (gerado por seed armazenado em `profiles.avatar_seed`)
- **Hosting**: Vercel (frontend) + Supabase (managed)

## Modelo de dados (Postgres / Supabase)

```sql
-- Auth & perfil
profiles (id uuid PK FK auth.users, display_name, avatar_seed text, avatar_style text,
          favorite_team_id int FK teams, created_at)

-- Estrutura da copa
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

-- Classificação calculada (cache via API ou edge function)
group_standings (group_letter char PK part, team_id int PK part,
                 position int, played int, won int, drawn int, lost int,
                 goals_for int, goals_against int, points int,
                 advanced_to_r32 bool nullable)

-- Palpites
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

-- Pontuação (cache calculado por edge function)
scores (id, user_id, source text [match|group|tournament],
        match_id nullable, group_letter nullable,
        points int, breakdown jsonb, computed_at)

-- Configuração
scoring_config (key PK, value jsonb)  -- pontos por tipo, editável pelo admin
```

**RLS (Row Level Security)**:
- `profiles`: SELECT público, UPDATE só próprio
- `predictions`/`group_predictions`/`tournament_predictions`: SELECT próprio (e SELECT público após `kickoff_at` da match), INSERT/UPDATE próprio apenas se `kickoff_at - now() > 5 min` e match `status = 'scheduled'`
- `matches`, `teams`, `scores`, `scoring_config`: SELECT público, escrita só via Edge Functions (service role)

> **Formato oficial do torneio** documentado em [`docs/FIFA-2026-FORMAT.md`](FIFA-2026-FORMAT.md) — fonte da verdade para grupos (A–L), fases, classificação (top 2 + 8 melhores 3ºs → 32-avos), critérios de desempate e chaveamento.

## Regras de pontuação (defaults configuráveis)

**Por partida**
- **Placar exato**: 10 pts
- **Resultado correto (W/D/L)**: 5 pts (não acumula com placar exato)
- **Saldo de gols correto** (quando não acerta placar exato): +2 pts

**Bônus de classificação por grupo** (calculado após o término da fase de grupos, 27/06)
- **1º colocado correto**: 5 pts
- **2º colocado correto**: 5 pts
- **3º colocado correto**: 3 pts
- **4º colocado correto**: 2 pts
- **Trinca certa "8 classificados aos 32-avos"**: +3 pts por time correto entre os 32 que avançaram (top 2 garantido + 3º que ficou entre os 8 melhores)

**Bônus do torneio**
- **Campeão**: 30 pts
- **Vice-campeão**: 15 pts
- **Terceiro lugar**: 10 pts

> **Especial — lançamento durante o torneio**: o palpite de campeão/vice/3º é liberado **até 27/06/2026** (fim da fase de grupos), pois o app entra no ar com o torneio já em andamento. Comunicar no onboarding.

Regras editáveis em `scoring_config` para ajuste antes de qualquer lock.

### Critérios de desempate (referência)
O bolão **não recalcula** os tiebreakers da FIFA. A coluna `position` final do grupo é lida do payload da API-Football, que já aplica head-to-head, saldo geral, gols, fair play e ranking FIFA conforme o regulamento (ver `FIFA-2026-FORMAT.md` §3.1).

## Estrutura de arquivos (greenfield)

```
fifa-bolao/
├── src/
│   ├── main.tsx, App.tsx
│   ├── lib/
│   │   ├── supabase.ts          # client + types
│   │   ├── scoring.ts           # cálculo de pontos (espelha edge function)
│   │   ├── dicebear.ts          # gerador de URL do avatar
│   │   └── format.ts            # datas/horas (date-fns + pt-BR)
│   ├── routes/
│   │   ├── login.tsx            # magic link
│   │   ├── onboarding.tsx       # nome, avatar, time favorito, palpite torneio
│   │   ├── home.tsx             # próximos jogos + minha posição
│   │   ├── matches.tsx          # lista com filtros (fase/grupo/dia/status)
│   │   ├── match-detail.tsx     # placar, lineups, stats, palpite
│   │   ├── predictions/
│   │   │   ├── index.tsx        # meus palpites
│   │   │   ├── groups.tsx       # classificação dos 12 grupos
│   │   │   └── tournament.tsx   # campeão/2º/3º
│   │   ├── ranking.tsx          # leaderboard
│   │   ├── profile.tsx          # perfil de outro participante
│   │   └── settings.tsx
│   ├── components/
│   │   ├── BottomNav.tsx        # navegação inferior mobile
│   │   ├── MatchCard.tsx, MatchListItem.tsx
│   │   ├── PredictionSheet.tsx  # sheet com steppers de placar
│   │   ├── LeaderboardRow.tsx
│   │   ├── Avatar.tsx           # DiceBear
│   │   ├── Countdown.tsx        # countdown até lock
│   │   ├── LiveBadge.tsx, ScoreDisplay.tsx
│   │   └── ui/ ...              # shadcn primitives
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMatches.ts, useMatch.ts
│   │   ├── usePrediction.ts
│   │   ├── useRanking.ts
│   │   └── useRealtimeMatch.ts  # Supabase Realtime subscribe
│   └── types/
│       ├── db.ts                # gerado: `supabase gen types`
│       └── domain.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql         # schema + RLS + seed scoring_config
│   │   └── 002_seed_teams.sql   # 48 seleções + grupos A–L
│   └── functions/
│       ├── sync-fixtures/       # cron: refresh fixtures + lineups
│       ├── sync-live/           # cron: status live + score atualizado
│       └── compute-scores/      # trigger: ao match.status=finished
├── .env.example                 # SUPABASE_URL, ANON_KEY, API_FOOTBALL_KEY
├── vite.config.ts, tailwind.config.ts, tsconfig.json
└── package.json
```

## Estratégia de sincronização (Edge Functions)

1. **`sync-fixtures`** — cron a cada 6h: busca `/fixtures?league=1&season=2026` (Copa) e faz upsert em `matches` + `teams`.
2. **`sync-live`** — cron a cada 1 min em dias de jogo, **30s quando há match com `status='live'`**: atualiza placares, status e estatísticas.
3. **`compute-scores`** — disparado quando uma match transita para `status='finished'`: roda `scoring.ts` no servidor sobre todas predictions dessa match e faz upsert em `scores`. Ao fim de cada fase de grupos completa, calcula bônus de classificação. No final do torneio, calcula bônus de campeão/2º/3º.

Frontend usa **TanStack Query** para fetch + **Supabase Realtime** subscribe em `matches` e `scores` para atualizações ao vivo na UI sem polling.

## Lock de palpites

- Validado em **dois lugares**:
  1. **Cliente**: desabilita UI quando `kickoff_at - now() ≤ 5 min` ou `status ≠ 'scheduled'`.
  2. **RLS no Postgres**: policy de INSERT/UPDATE em `predictions` checa o mesmo predicado (defesa contra request direta).
- Para jogos já realizados (entre 11/06 e 15/06): `status` já é `finished` → RLS bloqueia naturalmente. UI exibe esses jogos com tag "fora do bolão" e não pontuam.

## UX mobile-first

- **Bottom tab bar** fixa: Home / Jogos / Palpites / Ranking / Perfil
- **Sheet/Modal** para palpitar com `+/-` steppers grandes (target tap ≥44px)
- **Cards de jogo** com countdown ao kickoff e badge LIVE animado
- Layout testado a partir de 320px (iPhone SE) com breakpoints `sm:`, `md:` para tablet/desktop
- **Dark mode** automático via `prefers-color-scheme`
- **PWA básica** (manifest + service worker) para "Add to Home Screen"

## Fases de entrega (dada urgência)

**Fase 1 — MVP rushable (2–3 dias)**
- Auth magic link, schema + RLS, seed de teams/groups via 002_seed_teams.sql
- Sync inicial de fixtures (rodar `sync-fixtures` manualmente uma vez)
- Lista de jogos + palpitar + lock
- Cálculo de scoring básico de partida + ranking
- Bottom nav + onboarding mínimo (nome + avatar DiceBear)

**Fase 2 — Completar features (3–5 dias após Fase 1)**
- Palpites de grupo + torneio (campeão/2º/3º) com bônus
- Lineups + estatísticas no detalhe do jogo
- Realtime updates de placar
- Perfil de outros participantes + time favorito
- PWA + dark mode polish

**Fase 3 — Polish**
- Notificações (push via web push ou email pré-jogo)
- Histórico de pontuação por partida
- Stats agregadas (% de acerto, melhor palpite)

## Variáveis de ambiente

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Server-only (edge functions):
SUPABASE_SERVICE_ROLE_KEY=
API_FOOTBALL_KEY=
API_FOOTBALL_LEAGUE_ID=1     # World Cup
API_FOOTBALL_SEASON=2026
```

## Verificação ponta-a-ponta

1. **Setup**: `pnpm create vite@latest . --template react-ts` + `supabase init` + aplicar migrations.
2. **Auth**: solicitar magic link no `/login`, abrir email, redirecionar funcionar, sessão persistir.
3. **Onboarding**: criar perfil com avatar DiceBear (várias seeds), time favorito, palpite de campeão.
4. **Sync inicial**: invocar `supabase functions invoke sync-fixtures` localmente; verificar 104 matches + 48 teams populadas; jogos passados com `status='finished'`.
5. **Palpitar**: para um jogo futuro, salvar palpite; tentar editar a <5min do kickoff → bloqueado client + servidor (testar via curl direto).
6. **Score**: marcar manualmente uma match como `finished` com placar e invocar `compute-scores`; verificar linhas em `scores` com `breakdown` correto.
7. **Ranking**: leaderboard atualizado, ordenado por soma de pontos, com avatares.
8. **Mobile real**: abrir no celular em rede local (`vite --host`); testar palpitar com dedão; verificar viewport 320–430px sem overflow.
9. **Realtime**: dois browsers; admin atualiza placar de um match LIVE → outra tela atualiza sem refresh.
10. **RLS**: tentar via SQL direto (anon role) ler predictions de outro user antes do kickoff → deve falhar.

## Riscos & mitigações

- **Quota API-Football**: plano grátis tem ~100 reqs/dia. Mitigação: `sync-fixtures` 4x/dia + `sync-live` só com match ativa = ~50–100 reqs em dia de jogo. Upgrade ao plano pago ($20/mês) se necessário.
- **Magic link + email entregabilidade**: configurar SMTP customizado no Supabase (Resend gratuito) para evitar spam folder; testar antes do convite aos amigos.
- **Tempo curto vs Copa em andamento**: Fase 1 entregue antes da próxima rodada (16/06–17/06). Comunicar regra "jogos pré-15/06 não pontuam" aos amigos no onboarding.
- **Formato Copa 2026**: 48 seleções, 12 grupos (A–L), top 2 + 8 melhores 3ºs avançam aos 32-avos. Schema já contempla; conferir contra fonte oficial FIFA antes do seed.

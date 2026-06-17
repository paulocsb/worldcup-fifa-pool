# CLAUDE.md — Bolão FIFA 2026

Diretrizes para agentes (Claude Code) trabalhando neste repositório. Leia antes de qualquer mudança.

> **Documentos canônicos** (ordem de precedência em caso de conflito):
> 1. [`docs/FIFA-2026-FORMAT.md`](docs/FIFA-2026-FORMAT.md) — regras oficiais do torneio (grupos, fases, classificação, desempates). Fonte para qualquer dúvida sobre formato.
> 2. [`docs/PLAN.md`](docs/PLAN.md) — plano aprovado de implementação (escopo, modelo de dados, scoring, fases de entrega).
> 3. Este CLAUDE.md — diretrizes de agente.

---

## 1. Contexto do projeto

App de **bolão da Copa do Mundo FIFA 2026** para um grupo de amigos. **Mobile-first** (a maioria dos usuários acessa via celular). A Copa começou em **11/06/2026** e o app está sendo construído em paralelo ao torneio — entregar valor rapidamente é mais importante que perfeição.

**Regra de equidade**: jogos anteriores a 15/06/2026 não pontuam para ninguém. Comunicar no onboarding.

---

## 2. Stack & convenções

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack Query (`@tanstack/react-query`) |
| Roteamento | React Router (`react-router-dom`) |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions, Storage) |
| Dados ao vivo | API-Football (api-sports.io) |
| Avatares | DiceBear (URL gerada por seed) |
| Datas/i18n | `date-fns` + locale `pt-BR` |
| Package manager | pnpm |
| Hosting | Vercel (frontend) + Supabase managed (backend) |

**Convenções de código**:
- TypeScript estrito (`strict: true`, sem `any` implícito). Types gerados via `supabase gen types typescript`.
- Componentes em PascalCase; hooks em `useCamelCase`; arquivos kebab-case quando representam rota (`match-detail.tsx`), PascalCase para componentes (`MatchCard.tsx`).
- Imports absolutos via alias `@/` (configurar em `vite.config.ts` + `tsconfig.json`).
- Tailwind com `prefers-color-scheme` para dark mode automático.
- Mensagens de UI em **pt-BR** (audiência: amigos brasileiros).
- Targets de tap ≥44px; layout testado a partir de 320px.

**Estrutura de pastas**: ver árvore em `docs/PLAN.md`. Seguir exatamente para evitar drift.

---

## 3. Skills a usar (Claude Code)

Sempre que a tarefa se enquadrar, invoque o skill correspondente **antes** de codificar/responder:

| Tarefa | Skill |
|---|---|
| Build/arquitetura/review de React + TypeScript + Tailwind + shadcn | `react-typescript-stack` |
| Padrões de UI/UX, responsividade mobile, performance, acessibilidade | `frontend-expert` |
| Replanjar uma feature ou refatoração não-trivial | `/plan` (skill `plan` deste harness) |
| Simplificar/revisar código alterado | `simplify` |
| Revisar PR ou conjunto de mudanças | `review` |
| Auditoria de segurança nas mudanças pendentes | `security-review` |
| Loop de polling em deploy/CI | `loop` |
| Agendar tarefas recorrentes (ex.: monitorar sync diário) | `schedule` |

Para investigações exploratórias amplas em código, use o agent `Explore`. Para implementações que exigem arquitetura/trade-offs, use o agent `Plan`. Para escrita normal de código, apenas o skill correspondente já carrega o expertise.

> **Não invente skill names.** Use apenas os listados no system reminder da sessão.

---

## 4. Fluxo de trabalho (planning → dev → debugging)

### 4.1 Planejamento (`/plan`)
1. Para qualquer mudança que toque >2 arquivos, novas features, ou afete schema/RLS: comece com `/plan`.
2. O agent `Plan` deve consultar `docs/PLAN.md` para alinhar contexto antes de propor.
3. Plano aprovado → seguir para implementação. Plano substancial vira PR descritivo.

### 4.2 Desenvolvimento
1. Invocar skill `react-typescript-stack` para qualquer trabalho em componentes/hooks/rotas. Para questões de UX, layout responsivo, animações, acessibilidade — adicionar `frontend-expert`.
2. Antes de criar novo arquivo, **buscar utilitários existentes** em `src/lib/`, `src/hooks/`, `src/components/`. Reuso > novo código.
3. Manter `src/lib/scoring.ts` (client) sincronizado com `supabase/functions/compute-scores/` (server). A pontuação no servidor é a verdade; o cliente é só preview.
4. Toda escrita em `predictions`, `group_predictions`, `tournament_predictions` deve ser validada por **RLS** (não só no cliente). Quando criar/alterar policy, escrever teste SQL no `supabase/tests/`.
5. Migrations versionadas em `supabase/migrations/NNN_descricao.sql`. Nunca editar uma migration já aplicada em produção — sempre criar nova.
6. Componentes shadcn instalados sob demanda via `pnpm dlx shadcn@latest add <component>` e residem em `src/components/ui/`. Não editar diretamente — preferir wrappers em `src/components/`.

### 4.3 Debugging
1. Reproduzir o bug com inputs concretos antes de teorizar.
2. Logs de Edge Functions: `supabase functions logs <name>` ou no dashboard.
3. Para problemas de RLS: testar query como `anon` role no SQL editor do Supabase com `SET request.jwt.claims = '{...}'`.
4. Para problemas de sync com API-Football: checar `last_synced_at` da `match` e logs da função `sync-live`.
5. UI mobile: testar em dispositivo real via `vite --host` antes de declarar fix completo. Não confiar apenas em DevTools responsive mode.
6. Quando encontrar bug profundo, considere usar o agent `Plan` para mapear root cause + fix antes de mexer no código.

### 4.4 Review & merge
1. Antes de declarar uma tarefa pronta: rodar `pnpm typecheck`, `pnpm lint`, `pnpm test` (quando existirem).
2. Invocar skill `simplify` no conjunto de mudanças para eliminar reuso perdido e código morto.
3. Para PRs com mudanças sensíveis (RLS, scoring, auth): invocar `security-review`.
4. Commits sem `--no-verify`. Hooks que falhem devem ser corrigidos, não pulados.

---

## 5. Comandos comuns

```bash
# Setup inicial (rodar uma vez)
pnpm install
supabase start                              # postgres local + studio
supabase db reset                           # aplica migrations + seeds
supabase gen types typescript --local > src/types/db.ts

# Desenvolvimento
pnpm dev                                    # vite no http://localhost:5173
pnpm dev --host                             # exposto na LAN (teste mobile real)
supabase functions serve sync-live          # rodar edge function local

# Operações
supabase functions invoke sync-fixtures     # sync manual
supabase db push                            # aplica migrations no remoto
supabase functions deploy compute-scores    # deploy de edge function

# Qualidade
pnpm typecheck
pnpm lint
pnpm test
```

---

## 6. Segurança & dados sensíveis

- **Nunca** commitar `.env`, `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`. Manter `.env.example` atualizado com chaves vazias.
- Service role key **só** em Edge Functions. Cliente usa apenas `VITE_SUPABASE_ANON_KEY`.
- RLS habilitada em **todas** as tabelas. Default = deny. Cada nova tabela exige policy explícita.
- Validar lock de palpites em **dois lugares** (cliente UX + RLS no servidor). Cliente é cosmético; servidor é segurança.

---

## 7. Não fazer

- ❌ Não introduzir múltiplos bolões (feature explicitamente fora do MVP).
- ❌ Não escrever em `matches`, `teams` ou `scores` a partir do cliente — só Edge Functions.
- ❌ Não usar polling no cliente para placares ao vivo — usar Supabase Realtime.
- ❌ Não importar componentes de `src/components/ui/` em outras `ui/`. Composição vai em `src/components/`.
- ❌ Não amend em commits já enviados ao remoto.
- ❌ Não criar arquivos de documentação (READMEs, NOTES) sem solicitação explícita do usuário. Exceção: este `CLAUDE.md` e `docs/PLAN.md`.

---

## 8. Idioma

- **Código, identificadores, comentários (quando inevitáveis), commits**: inglês.
- **UI e mensagens de erro voltadas ao usuário**: pt-BR.
- **Conversas com o usuário neste repositório**: pt-BR (preferência demonstrada).

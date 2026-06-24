-- ----------------------------------------------------------------------------
-- ranking_snapshot
--
-- WHY: a feature de "variação de posição no ranking" (setas ▲▼) precisa
-- comparar a posição ATUAL de cada usuário com a posição que ele tinha ANTES
-- do último cálculo de pontos que efetivamente mudou algo.
--
-- compute-scores roda a cada partida finalizada (sync-live) E via pg_cron
-- horário (safety net) — ou seja, executa toda hora mesmo SEM mudanças. Se
-- gravássemos um snapshot a cada execução, o delta de posição zeraria sozinho
-- na próxima hora. Por isso o snapshot só é atualizado quando a rodada de
-- cálculo realmente insere/altera algum `scores.points`.
--
-- Esta tabela guarda os AGREGADOS (total_points, exact_count, scored_count)
-- de cada usuário no estado IMEDIATAMENTE ANTERIOR a esse cálculo. O client
-- deriva a posição anterior ordenando este conjunto com o MESMO comparador do
-- ranking atual (total_points DESC → exact_count DESC → scored_count DESC →
-- display_name ASC pt-BR) e calcula o delta de posição (atual vs. anterior).
--
-- Os agregados são derivados de `scores` com source='match', espelhando o que
-- o ranking usa hoje (useRanking.ts). Usuários sem score ficam de fora; o
-- client trata ausência como "novo na tabela".
-- ----------------------------------------------------------------------------

create table if not exists public.ranking_snapshot (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  total_points  int not null default 0,
  exact_count   int not null default 0,
  scored_count  int not null default 0,
  captured_at   timestamptz not null default now()
);

comment on table public.ranking_snapshot is
  'Agregados de ranking de cada usuário ANTES do último cálculo de pontos que mudou algo. O client deriva a posição anterior ordenando este conjunto com o mesmo comparador do ranking atual e calcula o delta de posição (setas de variação).';

alter table public.ranking_snapshot enable row level security;

-- Leitura pública (igual a `scores`): qualquer um pode ler para montar o delta.
create policy "ranking_snapshot read" on public.ranking_snapshot
  for select to authenticated, anon using (true);

-- INSERT / UPDATE / DELETE: nenhuma policy → default deny para anon/authenticated.
-- Apenas service_role (edge function compute-scores) escreve, pois bypassa RLS.

-- ----------------------------------------------------------------------------
-- Teste de RLS (rodar no SQL Editor do dashboard, dentro de uma transação
-- para que `set local role` tenha efeito):
--
--   begin;
--     set local role anon;
--
--     -- 1. SELECT como anon deve FUNCIONAR (leitura pública)
--     select count(*) from public.ranking_snapshot;   -- ok, retorna contagem
--
--     -- 2. INSERT como anon deve ser NEGADO (default deny, sem policy insert)
--     insert into public.ranking_snapshot (user_id) values (gen_random_uuid());
--     -- esperado: ERROR: new row violates row-level security policy
--                  for table "ranking_snapshot"
--   rollback;
-- ----------------------------------------------------------------------------

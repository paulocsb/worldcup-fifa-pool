-- ============================================================================
-- Cutoff por matchday em vez de data fixa.
--
-- Antes: scoring_start_at = '2026-06-16' → ignora jogos antes dessa data.
-- Agora: group_matchday_start = 2       → ignora jogos do MD1 da fase de grupos.
--
-- Motivação: o bolão entrou no ar com a Copa já em curso. Em vez de cravar
-- uma data, pulamos a 1ª rodada inteira (todos os 24 jogos de MD1) e
-- contabilizamos a partir da 2ª rodada. Knockouts sempre contam.
-- ============================================================================

alter table public.matches
  add column matchday int;

create index matches_matchday_idx
  on public.matches (stage, matchday)
  where stage = 'group';

insert into public.scoring_config (key, value)
values ('group_matchday_start', to_jsonb(2))
on conflict (key) do update set value = excluded.value, updated_at = now();

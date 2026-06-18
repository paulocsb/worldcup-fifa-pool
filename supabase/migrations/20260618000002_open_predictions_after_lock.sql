-- ============================================================================
-- Abre SELECT em predictions/group_predictions/tournament_predictions APÓS o
-- lock — pra permitir que cada usuário veja palpites dos OUTROS quando a
-- janela de palpitar daquele item já tiver encerrada.
--
-- Antes: cada user via só seus próprios (group/tournament) OU "após kickoff"
--        (predictions de placar).
-- Depois: todos veem palpite alheio assim que aquele palpite estiver locked,
--         pra não dar margem a copiar dos outros antes de fechar a janela.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Helper: tournament_predictions_open()
--    True se ainda existir QUALQUER match da fase de grupos com status
--    'scheduled' (lógica idêntica à da write policy do tournament).
-- ----------------------------------------------------------------------------
create or replace function public.tournament_predictions_open()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.matches m
    where m.stage = 'group'
      and m.status = 'scheduled'
  )
$$;

comment on function public.tournament_predictions_open is
  'true enquanto pelo menos um jogo da fase de grupos ainda não começou.';

-- ----------------------------------------------------------------------------
-- 2) predictions: trocar SELECT policy
--    Critério antes: "após kickoff". Critério depois: "após lock".
--    Diferença: lock é ~5min antes do kickoff (config lock_minutes).
-- ----------------------------------------------------------------------------
drop policy if exists "predictions read own" on public.predictions;
drop policy if exists "predictions read after lock" on public.predictions;

create policy "predictions read after lock"
  on public.predictions
  for select to authenticated
  using (
    user_id = auth.uid()
    or not public.match_predictions_open(match_id)
  );

-- ----------------------------------------------------------------------------
-- 3) group_predictions: trocar SELECT policy
-- ----------------------------------------------------------------------------
drop policy if exists "group_predictions read own" on public.group_predictions;
drop policy if exists "group_predictions read after lock" on public.group_predictions;

create policy "group_predictions read after lock"
  on public.group_predictions
  for select to authenticated
  using (
    user_id = auth.uid()
    or not public.group_predictions_open(group_letter)
  );

-- ----------------------------------------------------------------------------
-- 4) tournament_predictions: trocar SELECT policy
-- ----------------------------------------------------------------------------
drop policy if exists "tournament_predictions read own" on public.tournament_predictions;
drop policy if exists "tournament_predictions read after lock" on public.tournament_predictions;

create policy "tournament_predictions read after lock"
  on public.tournament_predictions
  for select to authenticated
  using (
    user_id = auth.uid()
    or not public.tournament_predictions_open()
  );

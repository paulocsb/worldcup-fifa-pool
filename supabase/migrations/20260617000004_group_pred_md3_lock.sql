-- ============================================================================
-- Lock de group_predictions: troca para "5 min antes da MD3" (última rodada da
-- fase de grupos). Como os 2 jogos de MD3 começam SIMULTANEAMENTE em qualquer
-- grupo da Copa, esse é o último momento sem info de jogo da rodada decisiva.
--
-- Regra antiga: aberto se qualquer match scheduled exista (fechava só quando
--               o último jogo iniciava — informação live da MD3 já corria).
-- Regra nova:   aberto SE nenhum jogo da MD3 começou E nenhum está nos
--               últimos 5 minutos pré-kickoff.
-- ============================================================================

-- Helper function (idempotente — usa replace)
create or replace function public.group_predictions_open(p_group_letter char(1))
returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from public.matches m
    where m.stage = 'group'
      and m.group_letter = p_group_letter
      and m.matchday = 3
      and (
        m.status <> 'scheduled'
        or m.kickoff_at - (
          (select coalesce((value)::int, 5)
             from public.scoring_config where key = 'lock_minutes')
          * interval '1 minute'
        ) <= now()
      )
  )
$$;

comment on function public.group_predictions_open is
  'true se palpite do grupo ainda está aberto (nenhum jogo da MD3 dentro da janela de lock ou já começou).';

-- Substitui policies
drop policy if exists "group_predictions insert own pre-stage-end" on public.group_predictions;
drop policy if exists "group_predictions update own pre-stage-end" on public.group_predictions;

create policy "group_predictions insert own pre-md3"
  on public.group_predictions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.group_predictions_open(group_letter)
  );

create policy "group_predictions update own pre-md3"
  on public.group_predictions
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.group_predictions_open(group_letter)
  );

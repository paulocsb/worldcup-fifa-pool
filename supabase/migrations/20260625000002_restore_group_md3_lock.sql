-- ============================================================================
-- Restaura o lock de group_predictions para a regra ORIGINAL: por grupo,
-- aberto até "MD3 - lock_minutes" daquele grupo.
--
-- O commit e8e2ed5 (migration 20260623000004_group_pred_md2_lock.sql) trocou a
-- função public.group_predictions_open por "fim da MD2 GLOBAL" (todos os grupos
-- fechando juntos, ignorando p_group_letter). Isso foi um EQUÍVOCO: a regra
-- aprovada (e descrita em rules.json -> lockGroup) sempre foi POR GRUPO, 5 min
-- antes do primeiro jogo da MD3 daquele grupo (os 2 jogos da MD3 de cada grupo
-- começam simultaneamente, então esse é o último marco sem info da rodada
-- decisiva).
--
-- Este forward-fix recria a função com o corpo EXATO da original
-- (20260617000004): stage='group', p_group_letter, matchday=3 e
-- kickoff_at - (lock_minutes * interval '1 minute') <= now().
--
-- As policies INSERT/UPDATE de group_predictions ("...pre-md3", criadas em
-- 20260617000004 e ainda vigentes em prod) já chamam
-- group_predictions_open(group_letter) -> restaurar a FUNÇÃO restaura o
-- comportamento. Nenhuma policy precisa ser recriada/renomeada aqui.
--
-- Efeito ao aplicar em prod: REABRE os grupos cuja MD3 ainda não entrou na
-- janela de lock; mantém fechados os que já passaram.
-- ============================================================================

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

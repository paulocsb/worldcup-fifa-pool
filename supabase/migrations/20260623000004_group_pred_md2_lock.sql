-- ============================================================================
-- Lock de group_predictions: troca para "fim da MD2 GLOBAL". Todos os grupos
-- fecham juntos no momento em que o último jogo da rodada 2 (independente do
-- grupo) terminar. A intenção é dar um único marco temporal para fechar os
-- palpites de classificação, em vez de cada grupo ter seu próprio fechamento.
--
-- Regra antiga: 5 minutos antes do primeiro jogo da MD3 daquele grupo.
-- Regra nova:   aberto enquanto existir QUALQUER jogo da MD2 (em qualquer
--               grupo) ainda não finalizado.
--
-- O parâmetro p_group_letter é mantido na assinatura para compatibilidade com
-- as policies (que chamam group_predictions_open(group_letter)), mas é
-- ignorado — o lock agora é global, não por grupo.
--
-- lock_minutes deixa de ser usado pelos palpites de grupo (segue valendo
-- para predictions e tournament).
-- ============================================================================

create or replace function public.group_predictions_open(p_group_letter char(1))
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.matches m
    where m.stage = 'group'
      and m.matchday = 2
      and m.status <> 'finished'
  )
$$;

comment on function public.group_predictions_open is
  'true enquanto existir QUALQUER jogo da MD2 (qualquer grupo) ainda não terminado. Lock global, não por grupo.';

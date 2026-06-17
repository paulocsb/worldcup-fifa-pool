-- ============================================================================
-- Migra avatares existentes do estilo 'fun-emoji' para 'croodles' (DiceBear),
-- alinhando com o novo default da app. Usuários mantêm o mesmo avatar_seed,
-- só muda a estilização que o DiceBear API renderiza.
--
-- Default da coluna também é atualizado para novos signups.
-- ============================================================================

alter table public.profiles
  alter column avatar_style set default 'croodles';

update public.profiles
set avatar_style = 'croodles'
where avatar_style = 'fun-emoji';

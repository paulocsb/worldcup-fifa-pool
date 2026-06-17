-- ============================================================================
-- Bootstrap admin: o primeiro profile criado vira admin automaticamente
-- (apenas se ainda não houver admin no sistema). Útil pra que o usuário
-- inicial (o dev) não precise rodar SQL manual após o primeiro signup.
-- ============================================================================

create or replace function public.maybe_promote_first_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where is_admin = true) then
    update public.profiles set is_admin = true where id = new.id;
  end if;
  return new;
end $$;

create trigger profiles_promote_first_admin
  after insert on public.profiles
  for each row execute function public.maybe_promote_first_admin();

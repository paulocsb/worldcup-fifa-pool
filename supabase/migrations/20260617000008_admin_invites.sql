-- ============================================================================
-- Admin role + RLS write em invites.
--
-- profiles.is_admin: boolean default false. Os perfis existentes (você) viram
-- admin via UPDATE. Próximos signups começam não-admin; admin promove via SQL
-- ou UI futura.
-- ============================================================================

alter table public.profiles
  add column is_admin boolean not null default false;

-- Promove perfis existentes a admin (no momento da migration só você existe)
update public.profiles set is_admin = true;

-- ----------------------------------------------------------------------------
-- Helper: chamado dentro de policies, retorna true se auth.uid() é admin
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Policies de escrita em invites: só admin
-- ----------------------------------------------------------------------------
create policy "invites admin insert" on public.invites
  for insert to authenticated
  with check (public.is_admin());

create policy "invites admin update" on public.invites
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "invites admin delete" on public.invites
  for delete to authenticated
  using (public.is_admin());

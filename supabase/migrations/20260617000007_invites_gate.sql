-- ============================================================================
-- Acesso por convite. Tabela public.invites + trigger em profiles que valida
-- e consome o invite no momento do primeiro signup.
--
-- Camadas de defesa:
--   1) /login UI valida via RPC e esconde o form se invite inválido
--   2) signInWithOtp passa invite_code em user_metadata (visível no JWT)
--   3) Trigger BEFORE INSERT em profiles consome o invite atomicamente
--      (impede que alguém crie profile sem invite — mesmo via REST direta)
-- ============================================================================

create table public.invites (
  code         text primary key check (char_length(code) between 4 and 40),
  description  text,
  max_uses     int check (max_uses is null or max_uses > 0),
  uses_count   int not null default 0,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.invites enable row level security;

-- Anon pode "ver" para validar — vai usar via RPC mas leitura direta também OK
create policy "invites read" on public.invites
  for select to anon, authenticated using (true);

-- Insert/update/delete só via service_role (admin com SQL/Studio).
-- Sem policy = bloqueado por RLS para anon/authenticated.

-- RPC pra validar (frontend chama antes de mostrar form)
create or replace function public.validate_invite(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invites
    where code = p_code
      and (expires_at is null or expires_at > now())
      and (max_uses is null or uses_count < max_uses)
  )
$$;

grant execute on function public.validate_invite(text) to anon, authenticated;

-- Trigger: ao criar profile, consome invite_code do user_metadata
create or replace function public.consume_invite_on_profile_create()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invite_code text;
begin
  -- Lê invite_code do user_metadata gravado pelo signInWithOtp({data: {...}})
  select (raw_user_meta_data->>'invite_code') into invite_code
  from auth.users
  where id = new.id;

  if invite_code is null or invite_code = '' then
    raise exception
      'Convite obrigatório. Use o link de convite para criar conta.'
      using errcode = '28000';  -- invalid_authorization_specification
  end if;

  -- Atualização atômica: incrementa só se ainda válido + tem usos disponíveis
  update public.invites
  set uses_count = uses_count + 1
  where code = invite_code
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses_count < max_uses);

  if not found then
    raise exception
      'Convite "%" expirado ou esgotado. Peça um novo ao admin.', invite_code
      using errcode = '28000';
  end if;

  return new;
end $$;

create trigger profiles_consume_invite
  before insert on public.profiles
  for each row execute function public.consume_invite_on_profile_create();

-- Seed: 1 invite default para o grupo de amigos (uses ilimitados)
insert into public.invites (code, description, max_uses)
values ('amigos2026', 'Convite geral pro grupo de amigos', null);

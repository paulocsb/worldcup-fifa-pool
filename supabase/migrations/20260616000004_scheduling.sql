-- ============================================================================
-- Scheduling automático das edge functions via pg_cron + pg_net.
--
-- Cron jobs criados:
--   * fifa-sync-live      — a cada 1 minuto
--   * fifa-sync-fixtures  — a cada 6 horas
--
-- Segredos em vault (chave do Supabase service role + URL base):
--   * fifa.edge_url       — base URL para chamadas internas a /functions/v1
--   * fifa.service_role   — JWT service role para autenticar a chamada
-- ============================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ----------------------------------------------------------------------------
-- Vault: seed das credenciais (apenas se ainda não existirem).
-- Em produção, use `supabase secrets set` ou Studio para sobrescrever.
-- Estes valores são os do stack local padrão (JWT demo determinístico).
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'fifa.edge_url') then
    perform vault.create_secret(
      'http://host.docker.internal:54321/functions/v1',
      'fifa.edge_url',
      'Base URL (sem barra final) das edge functions deste projeto'
    );
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'fifa.service_role') then
    perform vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      'fifa.service_role',
      'JWT service role para autenticar chamadas internas (local default)'
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Helper que dispara uma edge function lendo URL/key do vault.
-- ----------------------------------------------------------------------------
create or replace function public.invoke_edge_function(fn_name text, body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
as $$
declare
  base_url text;
  role_key text;
  request_id bigint;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'fifa.edge_url';
  select decrypted_secret into role_key from vault.decrypted_secrets where name = 'fifa.service_role';

  if base_url is null or role_key is null then
    raise exception 'vault: faltam segredos fifa.edge_url e/ou fifa.service_role';
  end if;

  select net.http_post(
    url := base_url || '/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || role_key
    ),
    body := body,
    timeout_milliseconds := 30000
  )
  into request_id;

  return request_id;
end $$;

comment on function public.invoke_edge_function is
  'Dispara uma edge function deste projeto via pg_net usando credenciais do vault.';

-- ----------------------------------------------------------------------------
-- Cron jobs (idempotentes: remove o existente antes de recriar)
-- ----------------------------------------------------------------------------
do $$
declare
  job_id int;
begin
  -- sync-live: a cada 1 minuto
  select jobid into job_id from cron.job where jobname = 'fifa-sync-live';
  if job_id is not null then perform cron.unschedule(job_id); end if;
  perform cron.schedule(
    'fifa-sync-live',
    '* * * * *',
    $job$select public.invoke_edge_function('sync-live')$job$
  );

  -- sync-fixtures: a cada 6 horas no minuto 5
  select jobid into job_id from cron.job where jobname = 'fifa-sync-fixtures';
  if job_id is not null then perform cron.unschedule(job_id); end if;
  perform cron.schedule(
    'fifa-sync-fixtures',
    '5 */6 * * *',
    $job$select public.invoke_edge_function('sync-fixtures')$job$
  );
end $$;

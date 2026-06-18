-- ============================================================================
-- Safety net cron: compute-scores roda toda hora cheia como rede de proteção.
--
-- Razão: sync-live invoca compute-scores SÓ ao detectar a transição
-- live→finished. Se o cron do sync-live falhar exatamente no minuto da
-- transição (rede, timeout API, etc.), a partida fica finished mas sem scores
-- gravados — e nenhum sync subsequente vai detectar a "transição" porque ela
-- já passou.
--
-- compute-scores é idempotente (upsert on conflict), então rodar a cada hora
-- é cheap e imune a esse caso. Custo: 24 invocações/dia.
-- ============================================================================

do $$
declare
  job_id int;
begin
  select jobid into job_id from cron.job
    where jobname = 'fifa-compute-scores-safety-net';
  if job_id is not null then perform cron.unschedule(job_id); end if;
  perform cron.schedule(
    'fifa-compute-scores-safety-net',
    '0 * * * *',
    $job$select public.invoke_edge_function('compute-scores')$job$
  );
end $$;

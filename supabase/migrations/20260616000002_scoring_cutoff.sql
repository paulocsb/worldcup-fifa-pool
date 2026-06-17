-- ============================================================================
-- Adiciona cutoff de pontuação: jogos com kickoff anterior a esta data
-- não geram pontos (regra de equidade: app entrou no ar durante a Copa).
-- Configurável em scoring_config para o admin ajustar se necessário.
-- ============================================================================

insert into public.scoring_config (key, value) values
  ('scoring_start_at', to_jsonb('2026-06-16T00:00:00Z'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();

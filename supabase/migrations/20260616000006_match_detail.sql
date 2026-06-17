-- ============================================================================
-- Detalhe da partida: lineups, eventos, estatísticas. Armazenados como JSONB
-- para evitar proliferação de tabelas — leitura é read-only e por fixture_id.
-- ============================================================================

alter table public.matches
  add column lineups          jsonb,
  add column events           jsonb,
  add column statistics       jsonb,
  add column detail_synced_at timestamptz;

create index matches_detail_synced_idx
  on public.matches (detail_synced_at)
  where status in ('live','finished');

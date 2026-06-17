-- ============================================================================
-- Adiciona coluna api_team_id em teams para mapear ID da API-Football
-- ao ID local. Preenchida pela edge function sync-fixtures na primeira execução.
-- ============================================================================

alter table public.teams
  add column api_team_id int unique;

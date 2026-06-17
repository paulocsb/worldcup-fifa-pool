-- ============================================================================
-- Colunas para detalhe de partida em tempo real:
--   * elapsed_minutes    — minuto atual do jogo (null fora do estado live)
--   * live_status_short  — código curto da API-Football (1H, HT, 2H, ET, BT, P, INT…)
--                          permite UI traduzir intervalo / pênaltis / etc.
-- Atualizados por sync-fixtures e sync-live.
-- ============================================================================

alter table public.matches
  add column elapsed_minutes   int,
  add column live_status_short text;

-- ============================================================================
-- Habilita Supabase Realtime para as tabelas que mudam durante o torneio.
-- Outras tabelas (teams, predictions, profiles) podem ser adicionadas depois.
-- ============================================================================

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.scores;

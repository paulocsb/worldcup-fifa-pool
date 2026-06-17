-- ============================================================================
-- Fix: UNIQUE de scores precisa de NULLS NOT DISTINCT para upserts idempotentes
-- (Postgres 15+). source='match' tem group_letter null; source='group' tem
-- match_id null. Sem essa opção, upsert criaria duplicatas.
-- ============================================================================

alter table public.scores
  drop constraint scores_user_id_source_match_id_group_letter_key;

alter table public.scores
  add constraint scores_user_source_match_group_unique
    unique nulls not distinct (user_id, source, match_id, group_letter);

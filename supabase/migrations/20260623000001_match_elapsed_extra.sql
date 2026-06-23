-- ============================================================================
-- Add elapsed_extra_minutes to matches.
--
-- Why: API-Football's fixture.status returns both `elapsed` (current minute)
-- and `extra` (added time in injury-time/stoppage). We've been persisting
-- only `elapsed_minutes`, so the UI shows "90'" when the actual game clock
-- reads "90+2'". This column lets the live timer surface the full minute
-- with stoppage time.
--
-- Notes:
--  * Existing rows get NULL (no historic injury-time data — irrelevant for
--    finished matches anyway since we don't display injury time post-match).
--  * Field is nullable: most of a match it'll be null; only set in
--    stoppage periods.
--  * Distinct from `home_score_extra` / `away_score_extra` (those are
--    extra-time aggregate scores in knockout matches).
-- ============================================================================

alter table public.matches
  add column if not exists elapsed_extra_minutes int;

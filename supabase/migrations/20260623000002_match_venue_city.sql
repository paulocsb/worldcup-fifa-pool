-- ============================================================================
-- Add venue_city to matches.
--
-- Why: the existing `venue` column stores only the stadium name (e.g.
-- "NRG Stadium"). API-Football also returns `venue.city`, which is useful
-- for surface "NRG Stadium · Houston, EUA" in the UI — clearer context for
-- users following an international tournament across three host countries.
--
-- The country is derived on the client from the city using a small mapping
-- (Copa 2026 has 16 host cities split across USA / Canada / Mexico), so no
-- additional column is needed for it.
-- ============================================================================

alter table public.matches
  add column if not exists venue_city text;

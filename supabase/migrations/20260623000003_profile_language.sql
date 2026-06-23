-- ============================================================================
-- Add language preference column to profiles.
--
-- Why: the app is going bilingual (pt-BR + en). Existing users (~20 friends
-- onboarded in pt-BR) should keep pt-BR by default; new signups can be
-- detected from navigator.language, then persisted here for cross-device
-- consistency.
--
-- Notes:
--  * Default 'pt-BR' keeps the existing audience untouched on apply.
--  * CHECK constraint limits to known locales; expand when adding new ones.
--  * No RLS change needed: profiles already has SELECT public + UPDATE own.
-- ============================================================================

alter table public.profiles
  add column if not exists language text not null default 'pt-BR';

-- Idempotent constraint creation (re-running the migration won't fail)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_language_check'
  ) then
    alter table public.profiles
      add constraint profiles_language_check
      check (language in ('pt-BR', 'en'));
  end if;
end $$;

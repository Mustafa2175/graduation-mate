-- 009_drop_obsolete_team_size_needed.sql
-- `profiles.team_size_needed` was legacy onboarding state and is not part of
-- the current closed-beta schema. Keep environments consistent by ensuring the
-- obsolete column is absent even if an older migration created it.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS team_size_needed;

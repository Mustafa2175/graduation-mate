-- 018_rate_limit_and_deletion.sql

-- ── 1. Swipe Rate Limiting Trigger ──
CREATE OR REPLACE FUNCTION public.check_swipe_limit()
RETURNS trigger AS $$
DECLARE
  swipe_count int;
BEGIN
  -- Count swipes in the last 1 minute for this user
  SELECT count(*) INTO swipe_count
  FROM public.swipes
  WHERE from_profile_id = NEW.from_profile_id
    AND created_at > now() - interval '1 minute';
  
  -- Limit to 60 swipes per minute
  IF swipe_count >= 60 THEN
    RAISE EXCEPTION 'Swipe rate limit exceeded. Please wait a minute.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_swipe_rate_limit ON public.swipes;
CREATE TRIGGER trg_swipe_rate_limit
  BEFORE INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.check_swipe_limit();


-- ── 2. Account Deletion Purge Trigger ──
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS trigger AS $$
BEGIN
  -- Deleting the profile row will trigger ON DELETE CASCADE on:
  -- profile_contacts, swipes, matches, and team_members.
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();


-- ── 3. Orphan Teams Purge Trigger ──
CREATE OR REPLACE FUNCTION public.cleanup_empty_teams()
RETURNS trigger AS $$
BEGIN
  -- If a team has no members left after a deletion, purge it
  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = OLD.team_id) THEN
    DELETE FROM public.teams WHERE id = OLD.team_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_empty_teams ON public.team_members;
CREATE TRIGGER trg_cleanup_empty_teams
  AFTER DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_empty_teams();

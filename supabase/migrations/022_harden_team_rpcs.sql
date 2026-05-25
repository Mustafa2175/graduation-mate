-- 022: Harden team RPC authentication checks
--
-- The previous RPCs compared auth.uid() with the supplied profile id using <>.
-- In PostgreSQL, NULL <> value evaluates to NULL, not TRUE, so anonymous calls
-- were not rejected by that guard. These replacements explicitly reject NULL
-- auth.uid(), pin the search path, and grant execution only to authenticated.

CREATE OR REPLACE FUNCTION public.create_team_for_profile(
  team_name text,
  creator_profile_id uuid
)
RETURNS public.teams
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_team public.teams;
BEGIN
  IF (select auth.uid()) IS NULL OR (select auth.uid()) <> creator_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match creator profile ID.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE profile_id = creator_profile_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = creator_profile_id AND team_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Leave your current team before creating another one.';
  END IF;

  INSERT INTO public.teams (name)
  VALUES (trim(team_name))
  RETURNING * INTO new_team;

  INSERT INTO public.team_members (team_id, profile_id)
  VALUES (new_team.id, creator_profile_id);

  UPDATE public.profiles
  SET team_id = new_team.id
  WHERE id = creator_profile_id;

  RETURN new_team;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_team_for_profile(
  team_id_to_join uuid,
  current_profile_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (select auth.uid()) IS NULL OR (select auth.uid()) <> current_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match profile ID.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE profile_id = current_profile_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = current_profile_id AND team_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Leave your current team before joining another one.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.teams WHERE id = team_id_to_join
  ) THEN
    RAISE EXCEPTION 'That team does not exist, or ID is invalid.';
  END IF;

  INSERT INTO public.team_members (team_id, profile_id)
  VALUES (team_id_to_join, current_profile_id);

  UPDATE public.profiles
  SET team_id = team_id_to_join
  WHERE id = current_profile_id;

  RETURN team_id_to_join;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_team_for_profile(
  team_id_to_leave uuid,
  current_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_members int;
BEGIN
  IF (select auth.uid()) IS NULL OR (select auth.uid()) <> current_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match profile ID.';
  END IF;

  DELETE FROM public.team_members
  WHERE team_id = team_id_to_leave AND profile_id = current_profile_id;

  UPDATE public.profiles
  SET team_id = NULL
  WHERE id = current_profile_id;

  SELECT count(*) INTO remaining_members
  FROM public.team_members
  WHERE team_id = team_id_to_leave;

  IF remaining_members = 0 THEN
    DELETE FROM public.teams
    WHERE id = team_id_to_leave;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_team_for_profile(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_team_for_profile(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leave_team_for_profile(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_team_for_profile(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_team_for_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_team_for_profile(uuid, uuid) TO authenticated;

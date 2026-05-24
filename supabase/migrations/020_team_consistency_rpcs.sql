-- 020: Atomic Team Operations and Data Consistency RPCs

-- 1. create_team_for_profile
CREATE OR REPLACE FUNCTION public.create_team_for_profile(
  team_name text,
  creator_profile_id uuid
)
RETURNS public.teams
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_team public.teams;
BEGIN
  -- Security check: ensure caller matches creator_profile_id
  IF auth.uid() <> creator_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match creator profile ID.';
  END IF;

  -- Consistency check: ensure creator is not currently in any team
  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE profile_id = creator_profile_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = creator_profile_id AND team_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Leave your current team before creating another one.';
  END IF;

  -- Insert the new team row
  INSERT INTO public.teams (name)
  VALUES (trim(team_name))
  RETURNING * INTO new_team;

  -- Insert the membership row
  INSERT INTO public.team_members (team_id, profile_id)
  VALUES (new_team.id, creator_profile_id);

  -- Update profiles convenience/denormalized team_id
  UPDATE public.profiles
  SET team_id = new_team.id
  WHERE id = creator_profile_id;

  RETURN new_team;
END;
$$;

-- 2. join_team_for_profile
CREATE OR REPLACE FUNCTION public.join_team_for_profile(
  team_id_to_join uuid,
  current_profile_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: ensure caller matches current_profile_id
  IF auth.uid() <> current_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match profile ID.';
  END IF;

  -- Consistency check: ensure user is not currently in any team
  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE profile_id = current_profile_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = current_profile_id AND team_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Leave your current team before joining another one.';
  END IF;

  -- Check if team exists
  IF NOT EXISTS (
    SELECT 1 FROM public.teams WHERE id = team_id_to_join
  ) THEN
    RAISE EXCEPTION 'That team does not exist, or ID is invalid.';
  END IF;

  -- Insert user into team_members
  INSERT INTO public.team_members (team_id, profile_id)
  VALUES (team_id_to_join, current_profile_id);

  -- Update profiles denormalized team_id
  UPDATE public.profiles
  SET team_id = team_id_to_join
  WHERE id = current_profile_id;

  RETURN team_id_to_join;
END;
$$;

-- 3. leave_team_for_profile
CREATE OR REPLACE FUNCTION public.leave_team_for_profile(
  team_id_to_leave uuid,
  current_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining_members int;
BEGIN
  -- Security check: ensure caller matches current_profile_id
  IF auth.uid() <> current_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID does not match profile ID.';
  END IF;

  -- Delete user from team_members
  DELETE FROM public.team_members
  WHERE team_id = team_id_to_leave AND profile_id = current_profile_id;

  -- Update profiles denormalized team_id to NULL
  UPDATE public.profiles
  SET team_id = NULL
  WHERE id = current_profile_id;

  -- Clean up empty team if no members left
  SELECT count(*) INTO remaining_members
  FROM public.team_members
  WHERE team_id = team_id_to_leave;

  IF remaining_members = 0 THEN
    DELETE FROM public.teams
    WHERE id = team_id_to_leave;
  END IF;
END;
$$;

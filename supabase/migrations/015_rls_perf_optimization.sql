-- Re-create policies with (select auth.uid()) so Postgres evaluates once per statement.

-- profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- teams
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update their team" ON public.teams;
DROP POLICY IF EXISTS "Team members can delete their team" ON public.teams;

CREATE POLICY "Team members can update their team"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Team members can delete their team"
  ON public.teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.profile_id = (select auth.uid())
    )
  );

-- team_members
DROP POLICY IF EXISTS "Authenticated users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_members;

CREATE POLICY "Authenticated users can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can leave teams"
  ON public.team_members FOR DELETE
  USING ((select auth.uid()) = profile_id);

-- swipes
DROP POLICY IF EXISTS "Users can view own swipes" ON public.swipes;
DROP POLICY IF EXISTS "Users can create own swipes" ON public.swipes;
DROP POLICY IF EXISTS "Users can delete own swipes" ON public.swipes;

CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT
  USING ((select auth.uid()) = from_profile_id);

CREATE POLICY "Users can create own swipes"
  ON public.swipes FOR INSERT
  WITH CHECK ((select auth.uid()) = from_profile_id);

CREATE POLICY "Users can delete own swipes"
  ON public.swipes FOR DELETE
  USING ((select auth.uid()) = from_profile_id);

-- matches
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;
DROP POLICY IF EXISTS "Match participants can update sharing flags" ON public.matches;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (
    (select auth.uid()) = profile1_id
    OR (select auth.uid()) = profile2_id
  );

CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Match participants can update sharing flags"
  ON public.matches FOR UPDATE
  USING (
    (select auth.uid()) = profile1_id
    OR (select auth.uid()) = profile2_id
  );

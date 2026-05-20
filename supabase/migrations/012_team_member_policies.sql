-- Only team members may modify or delete their team.
DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;

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

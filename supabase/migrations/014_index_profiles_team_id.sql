CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id)
  WHERE team_id IS NOT NULL;

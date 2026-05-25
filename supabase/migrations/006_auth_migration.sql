-- 1. Create trigger: auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, track, skills, commitment_level, team_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'OTHER',
    '{}',
    'MEDIUM',
    'LOOKING'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Drop plaintext password column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams: anyone can read, anyone authenticated can create
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update teams"
  ON public.teams FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete teams"
  ON public.teams FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team members: readable by all, modifiable by authenticated
CREATE POLICY "Team members are viewable by everyone"
  ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join teams"
  ON public.team_members FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can leave teams"
  ON public.team_members FOR DELETE USING (auth.uid() = profile_id);

-- Swipes: only owner can see/create their own swipes
CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT USING (auth.uid() = from_profile_id);

CREATE POLICY "Users can create own swipes"
  ON public.swipes FOR INSERT WITH CHECK (auth.uid() = from_profile_id);

CREATE POLICY "Users can delete own swipes"
  ON public.swipes FOR DELETE USING (auth.uid() = from_profile_id);

-- Matches: both participants can see their matches
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = profile1_id OR auth.uid() = profile2_id);

CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Match participants can update sharing flags"
  ON public.matches FOR UPDATE
  USING (auth.uid() = profile1_id OR auth.uid() = profile2_id);

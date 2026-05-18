-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams (defined before profiles so FK works)
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'LOOKING',
  looking_for_role text,
  looking_for_track text,
  created_at timestamptz DEFAULT now()
);

-- Profiles (main user table — no Supabase Auth)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  password text NOT NULL,
  department text,
  gpa float CHECK (gpa >= 0 AND gpa <= 4),
  track text NOT NULL DEFAULT 'OTHER',
  skills text[] DEFAULT '{}',
  commitment_level text NOT NULL DEFAULT 'MEDIUM',
  bio text,
  linkedin_url text,
  whatsapp_number text,
  is_available boolean DEFAULT true,
  team_status text DEFAULT 'LOOKING',
  looking_for_role text,
  avatar_url text,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Team members (junction table)
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Swipes
CREATE TABLE swipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('RIGHT', 'LEFT')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_profile_id, to_profile_id)
);

-- Matches
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_profiles_available ON profiles(is_available);
CREATE INDEX idx_profiles_track ON profiles(track);
CREATE INDEX idx_swipes_from ON swipes(from_profile_id);
CREATE INDEX idx_swipes_to ON swipes(to_profile_id);
CREATE INDEX idx_matches_p1 ON matches(profile1_id);
CREATE INDEX idx_matches_p2 ON matches(profile2_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_profile ON team_members(profile_id);

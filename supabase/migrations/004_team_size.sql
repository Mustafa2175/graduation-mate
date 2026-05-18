-- Add team size preference column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_size_needed integer DEFAULT 2;

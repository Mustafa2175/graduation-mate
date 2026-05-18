-- Add gated contact sharing flags to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS profile1_contact_shared boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS profile2_contact_shared boolean NOT NULL DEFAULT false;

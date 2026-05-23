-- 017: Enforce strict single-team membership
-- 1. Add UNIQUE constraint on team_members.profile_id (one team per student)
-- 2. Drop the redundant profiles.team_id column (dual source of truth)

-- Step 1: Remove any duplicate profile_id rows before adding the constraint.
-- Keep only the most recent membership per profile.
DELETE FROM public.team_members
WHERE id NOT IN (
  SELECT DISTINCT ON (profile_id) id
  FROM public.team_members
  ORDER BY profile_id, joined_at DESC
);

-- Step 2: Add the UNIQUE constraint on profile_id
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_profile_id_unique UNIQUE (profile_id);

-- NOTE: profiles.team_id is intentionally KEPT as a denormalized
-- convenience column. It is maintained in sync by teams.ts mutations
-- (createTeam, joinTeam, leaveTeam) and is read by profiles.ts,
-- my-team/page.tsx, profile/edit/page.tsx, and discover filtering.

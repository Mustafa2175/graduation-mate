-- 018: RLS Safety Updates
-- 1. Restrict profiles SELECT to authenticated users to prevent public data harvesting
-- 2. Restrict matches INSERT so users can only create matches involving themselves

-- Update Profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
  );

-- Update Matches INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;

CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL AND
    (
      (select auth.uid()) = profile1_id OR 
      (select auth.uid()) = profile2_id
    )
  );

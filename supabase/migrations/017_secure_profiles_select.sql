-- 017_secure_profiles_select.sql
-- Restrict profiles SELECT policy from fully public to authenticated users only.

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users only"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

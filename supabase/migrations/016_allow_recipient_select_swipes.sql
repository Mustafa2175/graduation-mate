-- 016_allow_recipient_select_swipes.sql

-- Drop the old policy that only allows the sender to view their swipes
DROP POLICY IF EXISTS "Users can view own swipes" ON public.swipes;

-- Create the new policy allowing either the sender or the recipient to view the swipe.
-- This is necessary to show incoming "Invites" in the Connections page while preserving privacy.
CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT
  USING (
    (select auth.uid()) = from_profile_id
    OR (select auth.uid()) = to_profile_id
  );

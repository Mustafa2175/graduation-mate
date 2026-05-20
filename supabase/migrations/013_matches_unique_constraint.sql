-- Prevent duplicate matches for the same pair regardless of profile order.
CREATE UNIQUE INDEX IF NOT EXISTS matches_no_duplicates
  ON public.matches (
    LEAST(profile1_id, profile2_id),
    GREATEST(profile1_id, profile2_id)
  );

-- Enforce the product rule that profiles with GPA below 2 are rejected.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_gpa_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gpa_check CHECK (gpa IS NULL OR (gpa >= 2 AND gpa <= 4)) NOT VALID;

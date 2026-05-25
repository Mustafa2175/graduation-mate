-- Move contact fields off the publicly-readable profiles table.
CREATE TABLE public.profile_contacts (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  linkedin_url text,
  whatsapp_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.profile_contacts (profile_id, linkedin_url, whatsapp_number)
SELECT id, linkedin_url, whatsapp_number
FROM public.profiles
WHERE linkedin_url IS NOT NULL OR whatsapp_number IS NOT NULL;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS whatsapp_number;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile contacts"
  ON public.profile_contacts FOR SELECT
  USING ((select auth.uid()) = profile_id);

CREATE POLICY "Matched users can read when both shared contacts"
  ON public.profile_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.profile1_contact_shared = true
        AND m.profile2_contact_shared = true
        AND (
          (m.profile1_id = (select auth.uid()) AND m.profile2_id = profile_contacts.profile_id)
          OR (m.profile2_id = (select auth.uid()) AND m.profile1_id = profile_contacts.profile_id)
        )
    )
  );

CREATE POLICY "Users can insert own profile contacts"
  ON public.profile_contacts FOR INSERT
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update own profile contacts"
  ON public.profile_contacts FOR UPDATE
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

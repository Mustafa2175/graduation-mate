-- 021: Team Invitations
-- Lightweight invitation system for post-match team collaboration.
-- A team member can send a pending invite to a mutual match.
-- The recipient can accept (triggering join_team_for_profile) or decline.

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id             uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sender_profile_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_profile_id uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              text        NOT NULL DEFAULT 'PENDING'
                                  CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  responded_at        timestamptz
);

-- Prevent duplicate PENDING invites for the same team + recipient pair.
-- Two teams can each invite the same user, but one team cannot send duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_team_invite
  ON public.team_invitations (team_id, recipient_profile_id)
  WHERE status = 'PENDING';

-- Index for fast lookups by recipient (the common read path)
CREATE INDEX IF NOT EXISTS idx_team_invitations_recipient
  ON public.team_invitations (recipient_profile_id, status);

-- Index for fast lookups by sender
CREATE INDEX IF NOT EXISTS idx_team_invitations_sender
  ON public.team_invitations (sender_profile_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Sender can INSERT an invite only when they are already a member of team_id
CREATE POLICY "Sender can create invite for own team"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_profile_id
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_invitations.team_id
        AND profile_id = sender_profile_id
    )
  );

-- Both sender and recipient can view the invitation row
CREATE POLICY "Sender and recipient can view their invitations"
  ON public.team_invitations
  FOR SELECT
  USING (
    auth.uid() = sender_profile_id
    OR auth.uid() = recipient_profile_id
  );

-- Only the recipient can update status (accept or decline)
CREATE POLICY "Recipient can respond to invitations"
  ON public.team_invitations
  FOR UPDATE
  USING (auth.uid() = recipient_profile_id)
  WITH CHECK (auth.uid() = recipient_profile_id);

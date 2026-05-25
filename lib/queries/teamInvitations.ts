// lib/queries/teamInvitations.ts
import { supabase } from '@/lib/supabase/client'

export interface TeamInvitation {
  id: string
  team_id: string
  sender_profile_id: string
  recipient_profile_id: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
  responded_at: string | null
  // Joined fields
  team?: { id: string; name: string }
  sender?: { id: string; full_name: string; avatar_url: string | null }
}

/** Returns the team_id the given profile currently belongs to, or null. */
export async function getMyTeamId(profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.team_id ?? null
}

/**
 * Send a team invitation from sender to recipient.
 * The sender must already be a member of team_id (enforced by DB RLS).
 * Throws if a PENDING invite already exists for this team + recipient pair.
 */
export async function sendTeamInvitation(
  teamId: string,
  senderProfileId: string,
  recipientProfileId: string,
): Promise<void> {
  const { error } = await supabase.from('team_invitations').insert({
    team_id: teamId,
    sender_profile_id: senderProfileId,
    recipient_profile_id: recipientProfileId,
    status: 'PENDING',
  })

  if (error) {
    // Unique constraint violation — duplicate pending invite
    if (error.code === '23505') {
      throw new Error('You already sent a pending invite to this person.')
    }
    throw new Error(error.message)
  }
}

/**
 * Returns all PENDING team invitations sent TO the given profile,
 * including sender name and team name for display.
 */
export async function getPendingInvitationsReceived(
  profileId: string,
): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from('team_invitations')
    .select(`
      id, team_id, sender_profile_id, recipient_profile_id,
      status, created_at, responded_at,
      team:team_id ( id, name ),
      sender:sender_profile_id ( id, full_name, avatar_url )
    `)
    .eq('recipient_profile_id', profileId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TeamInvitation[]
}

/**
 * Returns all invitations sent BY the given profile,
 * keyed by recipient_profile_id for quick UI deduplication checks.
 */
export async function getSentInvitations(
  profileId: string,
): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from('team_invitations')
    .select('id, team_id, recipient_profile_id, status, created_at')
    .eq('sender_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TeamInvitation[]
}

/**
 * Accept a team invitation.
 * 1. Marks the invitation ACCEPTED.
 * 2. Calls join_team_for_profile RPC so all single-team rules are enforced.
 * Throws if the user is already in a team.
 */
export async function acceptTeamInvitation(
  invitationId: string,
  teamId: string,
  myProfileId: string,
): Promise<void> {
  // Step 1: update status first (recipient-only policy enforces ownership)
  const { error: updateError } = await supabase
    .from('team_invitations')
    .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('recipient_profile_id', myProfileId)

  if (updateError) throw new Error(updateError.message)

  // Step 2: join the team using the existing SECURITY DEFINER RPC
  const { error: joinError } = await supabase.rpc('join_team_for_profile', {
    team_id_to_join: teamId,
    current_profile_id: myProfileId,
  })

  if (joinError) {
    // Roll back the status update so the invite can be retried
    await supabase
      .from('team_invitations')
      .update({ status: 'PENDING', responded_at: null })
      .eq('id', invitationId)
      .eq('recipient_profile_id', myProfileId)

    if (
      joinError.message?.includes('Leave your current team') ||
      joinError.code === '23505'
    ) {
      throw new Error('Leave your current team before accepting this invite.')
    }
    throw new Error(joinError.message)
  }
}

/**
 * Decline a team invitation.
 * Sets status to DECLINED and records responded_at.
 */
export async function declineTeamInvitation(
  invitationId: string,
  myProfileId: string,
): Promise<void> {
  const { error } = await supabase
    .from('team_invitations')
    .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('recipient_profile_id', myProfileId)

  if (error) throw new Error(error.message)
}

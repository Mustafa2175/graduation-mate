import { supabase } from '@/lib/supabase/client'
import { Team, Profile } from '@/types'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeInviteId(inviteId: string) {
  return inviteId.trim().toLowerCase()
}

function assertValidInviteId(inviteId: string) {
  if (!UUID_PATTERN.test(inviteId)) {
    throw new Error('Enter a valid team invite ID.')
  }
}

async function getExistingTeamId(profileId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (membership?.team_id) return membership.team_id

  const { data, error } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', profileId)
    .maybeSingle()

  if (error) throw error
  return data?.team_id || null
}

async function resolveTeamInviteId(inviteId: string) {
  const { data: directTeam, error: directTeamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', inviteId)
    .maybeSingle()

  if (directTeamError) throw directTeamError
  if (directTeam?.id) return directTeam.id

  const { data: inviterProfile, error: profileError } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', inviteId)
    .maybeSingle()

  if (profileError) throw profileError
  if (inviterProfile?.team_id) return inviterProfile.team_id

  const { data: inviterMembership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('profile_id', inviteId)
    .maybeSingle()

  if (membershipError) throw membershipError
  return inviterMembership?.team_id || null
}

export async function createTeam(name: string, creatorProfileId: string) {
  const { data: team, error } = await supabase.rpc('create_team_for_profile', {
    team_name: name,
    creator_profile_id: creatorProfileId
  })

  if (error) {
    throw new Error(error.message)
  }

  return team
}

export async function joinTeam(teamIdToJoin: string, currentProfileId: string) {
  const inviteId = normalizeInviteId(teamIdToJoin)
  assertValidInviteId(inviteId)

  const teamId = await resolveTeamInviteId(inviteId)

  if (!teamId) {
    throw new Error('That team does not exist, or ID is invalid.')
  }

  const { data, error } = await supabase.rpc('join_team_for_profile', {
    team_id_to_join: teamId,
    current_profile_id: currentProfileId
  })

  if (error) {
    if (error.code === '23505' || error.message?.includes('unique_constraint') || error.message?.includes('Leave your current team')) {
      throw new Error('Leave your current team before joining another one.')
    }
    throw new Error(error.message)
  }

  return teamId
}

export async function leaveTeam(teamId: string, profileId: string) {
  const { error } = await supabase.rpc('leave_team_for_profile', {
    team_id_to_leave: teamId,
    current_profile_id: profileId
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getTeamMembers(teamId: string): Promise<Profile[]> {
  const { data } = await supabase
    .from('team_members')
    .select('profiles(*)')
    .eq('team_id', teamId)
  return (data?.map((d: any) => d.profiles) || []) as Profile[]
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  return data as Team | null
}

export async function updateTeamDetails(teamId: string, updates: Partial<Team>) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()
  return { data: data as Team | null, error }
}

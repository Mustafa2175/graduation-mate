import { supabase } from '@/lib/supabase/client'

export async function createTeam(name: string, creatorProfileId: string) {
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name })
    .select()
    .single()
  
  if (teamErr || !team) throw teamErr

  await supabase
    .from('team_members')
    .insert({ team_id: team.id, profile_id: creatorProfileId })

  await supabase
    .from('profiles')
    .update({ team_id: team.id })
    .eq('id', creatorProfileId)

  return team
}

export async function joinTeam(targetProfileIdToJoin: string, currentProfileId: string) {
  const { data: targetProfile, error } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', targetProfileIdToJoin)
    .single()

  if (error || !targetProfile?.team_id) {
    throw new Error('That user is not in a team, or ID is invalid.')
  }

  const teamId = targetProfile.team_id

  await supabase
    .from('team_members')
    .insert({ team_id: teamId, profile_id: currentProfileId })

  await supabase
    .from('profiles')
    .update({ team_id: teamId })
    .eq('id', currentProfileId)

  return teamId
}

export async function leaveTeam(teamId: string, profileId: string) {
  await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('profile_id', profileId)

  await supabase
    .from('profiles')
    .update({ team_id: null })
    .eq('id', profileId)

  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (count === 0) {
    await supabase.from('teams').delete().eq('id', teamId)
  }
}

export async function getTeamMembers(teamId: string) {
  const { data } = await supabase
    .from('team_members')
    .select('profiles(*)')
    .eq('team_id', teamId)
  return data?.map((d: any) => d.profiles) || []
}

export async function getTeamById(teamId: string) {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  return data
}

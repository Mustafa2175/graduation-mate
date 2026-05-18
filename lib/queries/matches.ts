// lib/queries/matches.ts
import { supabase } from '@/lib/supabase/client'

export async function getMatchesForProfile(profileId: string) {
  return supabase
    .from('matches')
    .select(`
      id, matched_at,
      profile1_contact_shared,
      profile2_contact_shared,
      profile1:profile1_id ( id, full_name, track, skills, whatsapp_number, linkedin_url, avatar_url, team_id ),
      profile2:profile2_id ( id, full_name, track, skills, whatsapp_number, linkedin_url, avatar_url, team_id )
    `)
    .or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`)
    .order('matched_at', { ascending: false })
}

export async function createMatch(profile1Id: string, profile2Id: string) {
  // Check if match already exists in either direction
  const { data: match1 } = await supabase
    .from('matches')
    .select('id')
    .eq('profile1_id', profile1Id)
    .eq('profile2_id', profile2Id)
    .maybeSingle()

  const { data: match2 } = await supabase
    .from('matches')
    .select('id')
    .eq('profile1_id', profile2Id)
    .eq('profile2_id', profile1Id)
    .maybeSingle()

  if (match1 || match2) {
    return { data: match1 || match2, error: null }
  }

  return supabase.from('matches').insert({
    profile1_id: profile1Id,
    profile2_id: profile2Id,
  })
}

export async function updateContactSharing(matchId: string, isP1: boolean, shared: boolean) {
  const updateData = isP1
    ? { profile1_contact_shared: shared }
    : { profile2_contact_shared: shared }
  
  return supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)
}


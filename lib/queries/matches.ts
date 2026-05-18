// lib/queries/matches.ts
import { supabase } from '@/lib/supabase/client'

export async function getMatchesForProfile(profileId: string) {
  return supabase
    .from('matches')
    .select(`
      id, matched_at,
      profile1:profile1_id ( id, full_name, track, skills, whatsapp_number, linkedin_url, avatar_url ),
      profile2:profile2_id ( id, full_name, track, skills, whatsapp_number, linkedin_url, avatar_url )
    `)
    .or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`)
    .order('matched_at', { ascending: false })
}

export async function createMatch(profile1Id: string, profile2Id: string) {
  return supabase.from('matches').insert({
    profile1_id: profile1Id,
    profile2_id: profile2Id,
  })
}

// lib/queries/matches.ts
import { supabase } from '@/lib/supabase/client'

const matchProfileSelect = `
  id, full_name, track, skills, avatar_url, team_id,
  profile_contacts (whatsapp_number, linkedin_url)
`

export function resolveProfileContacts(profile: {
  profile_contacts?:
    | { whatsapp_number?: string | null; linkedin_url?: string | null }
    | { whatsapp_number?: string | null; linkedin_url?: string | null }[]
    | null;
}) {
  const row = Array.isArray(profile.profile_contacts)
    ? profile.profile_contacts[0]
    : profile.profile_contacts;
  return {
    whatsapp_number: row?.whatsapp_number ?? null,
    linkedin_url: row?.linkedin_url ?? null,
  };
}

export async function getMatchesForProfile(profileId: string) {
  return supabase
    .from('matches')
    .select(`
      id, matched_at,
      profile1_contact_shared,
      profile2_contact_shared,
      profile1:profile1_id ( ${matchProfileSelect} ),
      profile2:profile2_id ( ${matchProfileSelect} )
    `)
    .or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`)
    .order('matched_at', { ascending: false })
}

export async function createMatch(profile1Id: string, profile2Id: string) {
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

  const result = await supabase.from('matches').insert({
    profile1_id: profile1Id,
    profile2_id: profile2Id,
  })

  if (result.error?.code === '23505') {
    const { data: existing1 } = await supabase
      .from('matches')
      .select('id')
      .eq('profile1_id', profile1Id)
      .eq('profile2_id', profile2Id)
      .maybeSingle()
    const { data: existing2 } = await supabase
      .from('matches')
      .select('id')
      .eq('profile1_id', profile2Id)
      .eq('profile2_id', profile1Id)
      .maybeSingle()
    return { data: existing1 || existing2, error: null }
  }

  return result
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

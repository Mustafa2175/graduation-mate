// lib/queries/profiles.ts
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export async function loginLookup(fullName: string, password: string) {
  return supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('full_name', fullName)
    .eq('password', password)
    .single()
}

export async function getDiscoverProfiles(currentProfileId: string, swipedIds: string[]) {
  // Fetch current user's team_id to filter out teammates
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', currentProfileId)
    .single()

  const excludeIds = [...swipedIds]

  if (currentProfile?.team_id) {
    const { data: teammates } = await supabase
      .from('profiles')
      .select('id')
      .eq('team_id', currentProfile.team_id)

    if (teammates) {
      teammates.forEach((t) => {
        if (!excludeIds.includes(t.id)) {
          excludeIds.push(t.id)
        }
      })
    }
  }

  let query = supabase
    .from('profiles')
    .select(`
      *,
      team_members (
        profile_id,
        profiles ( id, full_name, avatar_url )
      )
    `)
    .eq('is_available', true)
    .neq('id', currentProfileId)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  return query.order('created_at', { ascending: false })
}

export async function getProfileById(id: string) {
  return supabase.from('profiles').select('*').eq('id', id).single()
}

export async function upsertProfile(profile: Partial<Profile> & { id?: string }) {
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single()
  
  if (error && error.message.includes('team_size_needed')) {
    const { team_size_needed, ...fallbackProfile } = profile
    return supabase.from('profiles').upsert(fallbackProfile).select().single()
  }
  
  return { data, error }
}

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

  if (swipedIds.length > 0) {
    query = query.not('id', 'in', `(${swipedIds.join(',')})`)
  }

  return query.order('created_at', { ascending: false })
}

export async function getProfileById(id: string) {
  return supabase.from('profiles').select('*').eq('id', id).single()
}

export async function upsertProfile(profile: Partial<Profile> & { id?: string }) {
  return supabase.from('profiles').upsert(profile).select().single()
}

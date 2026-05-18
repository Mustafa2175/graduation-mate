// lib/queries/swipes.ts
import { supabase } from '@/lib/supabase/client'

export async function getSwipedIds(fromProfileId: string): Promise<string[]> {
  const { data } = await supabase
    .from('swipes')
    .select('to_profile_id')
    .eq('from_profile_id', fromProfileId)
  return data?.map(s => s.to_profile_id) ?? []
}

export async function insertSwipe(
  fromProfileId: string,
  toProfileId: string,
  direction: 'RIGHT' | 'LEFT'
) {
  return supabase.from('swipes').insert({
    from_profile_id: fromProfileId,
    to_profile_id: toProfileId,
    direction,
  })
}

export async function checkMutualMatch(profileA: string, profileB: string): Promise<boolean> {
  const { data } = await supabase
    .from('swipes')
    .select('id')
    .eq('from_profile_id', profileB)
    .eq('to_profile_id', profileA)
    .eq('direction', 'RIGHT')
    .single()
  return !!data
}

// lib/queries/matches.ts
import { supabase } from '@/lib/supabase/client'

const matchProfileSelect = `
  id, full_name, track, skills, avatar_url, team_id,
  profile_contacts (whatsapp_number, linkedin_url),
  teams:team_id (
    id, name, status, project_description, project_technologies, roles_needed,
    team_members (
      profile_id,
      profiles:profile_id ( id, full_name, avatar_url )
    )
  )
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
    profile1_contact_shared: true,
    profile2_contact_shared: true,
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

export async function getConnections(profileId: string) {
  // 1. Fetch Mutual Matches
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      id, matched_at,
      profile1:profile1_id ( ${matchProfileSelect} ),
      profile2:profile2_id ( ${matchProfileSelect} )
    `)
    .or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`)
    .order('matched_at', { ascending: false });

  if (matchesError) throw matchesError;

  const matchedProfileIds = new Set<string>();
  const mutualConnections = (matches || []).map((m: any) => {
    const p1 = Array.isArray(m.profile1) ? m.profile1[0] : m.profile1;
    const p2 = Array.isArray(m.profile2) ? m.profile2[0] : m.profile2;
    const other = p1.id === profileId ? p2 : p1;
    matchedProfileIds.add(other.id);

    const teamData = Array.isArray(other.teams) ? other.teams[0] : other.teams;
    const teammates = teamData?.team_members
      ? teamData.team_members
          .map((tm: any) => Array.isArray(tm.profiles) ? tm.profiles[0] : tm.profiles)
          .filter((p: any) => p && p.id !== other.id)
      : [];

    return {
      id: m.id,
      type: 'MUTUAL' as const,
      profile: other,
      matched_at: m.matched_at,
      teamName: teamData?.name || null,
      teamId: teamData?.id || null,
      teammates,
    };
  });

  // 2. Fetch all swipes to/from this user
  const { data: allSwipes, error: swipesError } = await supabase
    .from('swipes')
    .select('from_profile_id, to_profile_id, direction, created_at')
    .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

  if (swipesError) throw swipesError;

  const swipes = allSwipes || [];
  
  // Set of all profiles I have swiped on (either LEFT or RIGHT)
  const swipedByMeIds = new Set(
    swipes.filter(s => s.from_profile_id === profileId).map(s => s.to_profile_id)
  );

  // Outgoing pending = I swiped RIGHT, and they are not mutually matched
  const outgoingPendingIds = new Set(
    swipes
      .filter(s => s.from_profile_id === profileId && s.direction === 'RIGHT' && !matchedProfileIds.has(s.to_profile_id))
      .map(s => s.to_profile_id)
  );

  // Incoming pending = They swiped RIGHT on me, and I haven't swiped on them at all, and not mutually matched
  const incomingPendingSwipes = swipes.filter(
    s => s.to_profile_id === profileId && s.direction === 'RIGHT' && !matchedProfileIds.has(s.from_profile_id) && !swipedByMeIds.has(s.from_profile_id)
  );

  const pendingProfileIds = [
    ...Array.from(outgoingPendingIds),
    ...incomingPendingSwipes.map(s => s.from_profile_id)
  ];

  let profilesMap = new Map<string, any>();
  if (pendingProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id, full_name, department, gpa, track, skills,
        commitment_level, bio, is_available, team_status,
        looking_for_role, avatar_url, team_id, created_at,
        teams:team_id (
          id, name, status, project_description, project_technologies, roles_needed,
          team_members (
            profile_id,
            profiles:profile_id ( id, full_name, avatar_url )
          )
        )
      `)
      .in('id', pendingProfileIds);
    profiles?.forEach(p => profilesMap.set(p.id, p));
  }

  const outgoingRequests = Array.from(outgoingPendingIds)
    .map(id => {
      const profile = profilesMap.get(id);
      if (!profile) return null;
      const teamData = Array.isArray(profile.teams) ? profile.teams[0] : profile.teams;
      const teammates = teamData?.team_members
        ? teamData.team_members
            .map((tm: any) => Array.isArray(tm.profiles) ? tm.profiles[0] : tm.profiles)
            .filter((p: any) => p && p.id !== profile.id)
        : [];
      return {
        id: `outgoing-${id}`,
        type: 'OUTGOING' as const,
        profile,
        matched_at: new Date().toISOString(),
        teamName: teamData?.name || null,
        teamId: teamData?.id || null,
        teammates,
      };
    })
    .filter((x): x is any => x !== null);

  const incomingRequests = incomingPendingSwipes
    .map(s => {
      const profile = profilesMap.get(s.from_profile_id);
      if (!profile) return null;
      const teamData = Array.isArray(profile.teams) ? profile.teams[0] : profile.teams;
      const teammates = teamData?.team_members
        ? teamData.team_members
            .map((tm: any) => Array.isArray(tm.profiles) ? tm.profiles[0] : tm.profiles)
            .filter((p: any) => p && p.id !== profile.id)
        : [];
      return {
        id: `incoming-${s.from_profile_id}`,
        type: 'INCOMING' as const,
        profile,
        matched_at: s.created_at,
        teamName: teamData?.name || null,
        teamId: teamData?.id || null,
        teammates,
      };
    })
    .filter((x): x is any => x !== null);

  incomingRequests.sort((a: any, b: any) => new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime());

  return {
    mutual: mutualConnections,
    incoming: incomingRequests,
    outgoing: outgoingRequests,
  };
}

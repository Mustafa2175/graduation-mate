// lib/queries/matches.ts
import { supabase } from '@/lib/supabase/client'

const matchProfileSelect = `
  id, full_name, track, skills, avatar_url, bio,
  profile_contacts (whatsapp_number, linkedin_url),
  team_members (
    teams (
      id,
      name,
      team_members (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    )
  )
`

export interface TeammateProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface TeamData {
  id: string;
  name: string;
  teammates: TeammateProfile[];
}

export interface MatchProfile {
  id: string;
  full_name: string;
  track: string;
  skills: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  profile_contacts?: any;
}

export interface ConnectionItem {
  id: string;
  type: 'MUTUAL' | 'INCOMING' | 'OUTGOING';
  profile: MatchProfile;
  matched_at: string;
  teamName?: string;
  teamId?: string;
  teammates: TeammateProfile[];
}

export interface TeamData {
  id: string;
  name: string;
  teammates: TeammateProfile[];
}

export function extractTeamData(profile: any): TeamData | null {
  const teamMember = Array.isArray(profile.team_members) ? profile.team_members[0] : profile.team_members;
  const team = teamMember?.teams;
  if (!team) return null;

  const rawTeammates = Array.isArray(team.team_members) ? team.team_members : (team.team_members ? [team.team_members] : []);
  
  const teammates = rawTeammates
    .map((tm: any) => tm.profiles)
    .filter((p: any) => p && p.id !== profile.id); // Exclude the profile itself

  return {
    id: team.id,
    name: team.name,
    teammates
  };
}

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
  const mutualConnections: ConnectionItem[] = (matches || []).map((m: any) => {
    const p1 = Array.isArray(m.profile1) ? m.profile1[0] : m.profile1;
    const p2 = Array.isArray(m.profile2) ? m.profile2[0] : m.profile2;
    const other = p1.id === profileId ? p2 : p1;
    matchedProfileIds.add(other.id);
    const teamData = extractTeamData(other);
    return {
      id: m.id,
      type: 'MUTUAL' as const,
      profile: other,
      matched_at: m.matched_at,
      teamName: teamData?.name,
      teamId: teamData?.id,
      teammates: teamData?.teammates || []
    };
  }) as ConnectionItem[];

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
  const outgoingPendingSwipes = swipes.filter(
    s => s.from_profile_id === profileId && s.direction === 'RIGHT' && !matchedProfileIds.has(s.to_profile_id)
  );
  const outgoingPendingIds = new Set(outgoingPendingSwipes.map(s => s.to_profile_id));

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
        looking_for_role, avatar_url, created_at,
        team_members (
          teams (
            id,
            name,
            team_members (
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          )
        )
      `)
      .in('id', pendingProfileIds);
    profiles?.forEach(p => profilesMap.set(p.id, p));
  }

  const outgoingRequests: ConnectionItem[] = outgoingPendingSwipes
    .map(s => {
      const profile = profilesMap.get(s.to_profile_id);
      if (!profile) return null;
      const teamData = extractTeamData(profile);
      return {
        id: `outgoing-${s.to_profile_id}`,
        type: 'OUTGOING' as const,
        profile,
        matched_at: s.created_at,
        teamName: teamData?.name,
        teamId: teamData?.id,
        teammates: teamData?.teammates || []
      };
    })
    .filter(Boolean) as ConnectionItem[];

  const incomingRequests: ConnectionItem[] = incomingPendingSwipes
    .map(s => {
      const profile = profilesMap.get(s.from_profile_id);
      if (!profile) return null;
      const teamData = extractTeamData(profile);
      return {
        id: `incoming-${s.from_profile_id}`,
        type: 'INCOMING' as const,
        profile,
        matched_at: s.created_at, // Use the swipe creation time as the "matched_at" for pending requests
        teamName: teamData?.name,
        teamId: teamData?.id,
        teammates: teamData?.teammates || []
      };
    })
    .filter(Boolean) as ConnectionItem[];

  incomingRequests.sort((a: any, b: any) => new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime());

  return {
    mutual: mutualConnections,
    incoming: incomingRequests,
    outgoing: outgoingRequests,
  };
}

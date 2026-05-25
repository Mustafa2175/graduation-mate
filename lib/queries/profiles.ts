// lib/queries/profiles.ts
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";

type ProfileContactsRow = {
  linkedin_url: string | null;
  whatsapp_number: string | null;
};

function flattenProfileRow(data: Profile & { profile_contacts?: ProfileContactsRow | ProfileContactsRow[] }): Profile {
  const contacts = Array.isArray(data.profile_contacts)
    ? data.profile_contacts[0]
    : data.profile_contacts;
  const { profile_contacts: _removed, ...rest } = data;
  return {
    ...rest,
    linkedin_url: contacts?.linkedin_url ?? null,
    whatsapp_number: contacts?.whatsapp_number ?? null,
  };
}

export async function getDiscoverProfiles(
  currentProfileId: string,
  swipedIds: string[],
  limit: number = 20,
  cursor?: string // ISO timestamp of the last fetched profile's created_at
) {
  // Fetch current user's team_id to filter out teammates
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", currentProfileId)
    .single();

  const excludeIds = [...swipedIds];

  if (currentProfile?.team_id) {
    const { data: teammates } = await supabase
      .from("profiles")
      .select("id")
      .eq("team_id", currentProfile.team_id);

    if (teammates) {
      teammates.forEach((t) => {
        if (!excludeIds.includes(t.id)) {
          excludeIds.push(t.id);
        }
      });
    }
  }

  let query = supabase
    .from("profiles")
    .select(
      `
      id, full_name, department, gpa, track, skills,
      commitment_level, bio, is_available, team_status,
      looking_for_role, avatar_url, team_id, created_at,
      team_members (
        profile_id,
        profiles ( id, full_name, avatar_url )
      )
    `,
    )
    .eq("is_available", true)
    .neq("id", currentProfileId);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  if (cursor) {
    // Pagination: we order by created_at desc, so we want items created *before* the cursor
    query = query.lt("created_at", cursor);
  }

  return query.order("created_at", { ascending: false }).limit(limit);
}

export async function getProfileById(id: string) {
  const result = await supabase
    .from("profiles")
    .select("*, profile_contacts (linkedin_url, whatsapp_number)")
    .eq("id", id)
    .single();

  if (result.data) {
    return {
      ...result,
      data: flattenProfileRow(
        result.data as Profile & {
          profile_contacts?: ProfileContactsRow | ProfileContactsRow[];
        },
      ),
    };
  }
  return result;
}

export async function upsertProfileContacts(
  profileId: string,
  contacts: {
    linkedin_url?: string | null;
    whatsapp_number?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("profile_contacts")
    .upsert({ profile_id: profileId, ...contacts })
    .select()
    .single();
  return { data, error };
}

export async function upsertProfile(
  profile: Partial<Profile> & { id?: string },
) {
  const { linkedin_url: _l, whatsapp_number: _w, ...profileFields } = profile;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileFields)
    .select()
    .single();
  return { data, error };
}

export async function updateProfile(id: string, profile: Partial<Profile>) {
  const { linkedin_url: _l, whatsapp_number: _w, ...profileFields } = profile;
  const { data, error } = await supabase
    .from("profiles")
    .update(profileFields)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

// types/index.ts

export type Track = string

export type CommitmentLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type TeamStatus = 'LOOKING' | 'COMPLETE' | 'LOOKING_FOR_MORE'
export type SwipeDirection = 'RIGHT' | 'LEFT'

export interface Profile {
  id: string
  full_name: string
  password: string
  department: string | null
  gpa: number | null
  track: Track
  skills: string[]
  commitment_level: CommitmentLevel
  bio: string | null
  linkedin_url: string | null
  whatsapp_number: string | null
  is_available: boolean
  team_status: TeamStatus
  looking_for_role: string | null
  team_size_needed: number
  avatar_url: string | null
  team_id: string | null
  created_at: string
}

export interface Swipe {
  id: string
  from_profile_id: string
  to_profile_id: string
  direction: SwipeDirection
  created_at: string
}

export interface Match {
  id: string
  profile1_id: string
  profile2_id: string
  matched_at: string
}

export interface Team {
  id: string
  name: string
  status: TeamStatus
  looking_for_role: string | null
  looking_for_track: Track | null
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  profile_id: string
  joined_at: string
}

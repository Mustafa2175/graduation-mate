'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getMatchesForProfile, updateContactSharing } from '@/lib/queries/matches'
import { getTeamById, getTeamMembers } from '@/lib/queries/teams'
import { getInitials, TRACK_COLORS, TRACK_LABELS, cn } from '@/lib/utils'
import { MessageCircle, Briefcase, Lock, Unlock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SkillBadge from '@/components/profile/SkillBadge'
import Button from '@/components/ui/Button'

// Deterministic background color from name
const AVATAR_BG = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
]
function getAvatarBg(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_BG[code % AVATAR_BG.length]
}

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function MatchesPage() {
  const router = useRouter()
  const { getUser } = useCurrentUser()
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    setCurrentUserId(user.profileId)

    getMatchesForProfile(user.profileId).then(async ({ data }) => {
      if (data) {
        const matchesWithTeams = await Promise.all(
          data.map(async (match: any) => {
            const p1 = Array.isArray(match.profile1) ? match.profile1[0] : match.profile1
            const p2 = Array.isArray(match.profile2) ? match.profile2[0] : match.profile2
            if (!p1 || !p2) return match

            const isP1 = p1.id === user.profileId
            const profile = isP1 ? p2 : p1
            
            if (profile && profile.team_id) {
              try {
                const team = await getTeamById(profile.team_id)
                const members = await getTeamMembers(profile.team_id)
                const teammates = members.filter((m: any) => m.id !== profile.id)
                return {
                  ...match,
                  teamId: profile.team_id,
                  teamName: team?.name || 'Team',
                  teammates: teammates || [],
                }
              } catch (err) {
                console.error('Error fetching team members for match card:', err)
              }
            }
            return match
          })
        )
        setMatches(matchesWithTeams)
      }
      setIsLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleSharing = async (matchId: string, isP1: boolean, currentlyShared: boolean) => {
    setTogglingMap(prev => ({ ...prev, [matchId]: true }))
    try {
      const nextShared = !currentlyShared
      const { error } = await updateContactSharing(matchId, isP1, nextShared)
      if (!error) {
        setMatches(prev =>
          prev.map(m => {
            if (m.id === matchId) {
              return {
                ...m,
                profile1_contact_shared: isP1 ? nextShared : m.profile1_contact_shared,
                profile2_contact_shared: !isP1 ? nextShared : m.profile2_contact_shared,
              }
            }
            return m
          })
        )
      }
    } catch (err) {
      console.error('Error toggling contact sharing:', err)
    } finally {
      setTogglingMap(prev => ({ ...prev, [matchId]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="w-40 h-8 bg-gray-200 rounded-lg" />
          <div className="w-60 h-4 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
        <p className="text-sm text-gray-500 mt-1">
          {matches.length} {matches.length === 1 ? 'person wants' : 'people want'} to team up with you
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl">
            👻
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">No matches yet</h3>
            <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
              Keep swiping on the discover page to find your perfect teammates.
            </p>
          </div>
          <Link href="/discover" className="block w-full max-w-[200px]">
            <Button>Keep Swiping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
          {matches.map((match) => {
            // Determine which profile is the other person
            const p1 = Array.isArray(match.profile1) ? match.profile1[0] : match.profile1
            const p2 = Array.isArray(match.profile2) ? match.profile2[0] : match.profile2
            if (!p1 || !p2) return null

            const isP1 = p1.id === currentUserId
            const profile = isP1 ? p2 : p1

            const isMyContactShared = isP1 ? match.profile1_contact_shared : match.profile2_contact_shared
            const isTheirContactShared = isP1 ? match.profile2_contact_shared : match.profile1_contact_shared
            const contactVisible = isMyContactShared && isTheirContactShared

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header: Avatar & Name */}
                <div className="p-3 pb-0 flex flex-col items-center text-center space-y-2">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-50"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base ring-2 ring-gray-50',
                        getAvatarBg(profile.full_name)
                      )}
                    >
                      {getInitials(profile.full_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                      {profile.full_name}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Matched {timeAgo(match.matched_at)}
                    </p>
                  </div>
                </div>

                {/* Track Badge */}
                <div className="px-3 pt-2 flex justify-center">
                  <Badge color={TRACK_COLORS[profile.track as keyof typeof TRACK_COLORS]}>
                    {TRACK_LABELS[profile.track as keyof typeof TRACK_LABELS]}
                  </Badge>
                </div>

                {/* Skills */}
                <div className="px-3 py-2 flex-1 flex flex-col justify-center min-h-[50px]">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.skills?.slice(0, 3).map((skill: string) => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                    {profile.skills?.length > 3 && (
                      <span className="text-[10px] text-gray-400 self-center">
                        +{profile.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Details & Teammates */}
                {match.teamName && (
                  <div className="px-3 py-2.5 border-t border-gray-100 bg-orange-50/20 text-left flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black text-[#ef4d23] uppercase tracking-wider line-clamp-1">
                        👥 Team: {match.teamName}
                      </p>
                      {match.teammates && match.teammates.length > 0 ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-semibold shrink-0">Classmates:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {match.teammates.map((t: any) => (
                              t.avatar_url ? (
                                <img
                                  key={t.id}
                                  src={t.avatar_url}
                                  alt={t.full_name}
                                  title={t.full_name}
                                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                                />
                              ) : (
                                <div
                                  key={t.id}
                                  title={t.full_name}
                                  className={cn(
                                    "inline-block h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center text-[8px] font-black text-white",
                                    getAvatarBg(t.full_name)
                                  )}
                                >
                                  {getInitials(t.full_name)}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-gray-400 italic mt-0.5">No teammates joined yet</p>
                      )}
                    </div>
                    {match.teamId && (
                      <Link
                        href={`/teams/${match.teamId}`}
                        className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#ef4d23] transition-colors shrink-0 flex items-center justify-center"
                        title="View Team Details"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}

                {/* Gated Contact Info Switch & Status Badge */}
                <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex flex-col space-y-2 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Share My Contact</span>
                    <button
                      onClick={() => handleToggleSharing(match.id, isP1, isMyContactShared)}
                      disabled={togglingMap[match.id]}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                        isMyContactShared ? "bg-violet-600" : "bg-gray-200",
                        togglingMap[match.id] && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          isMyContactShared ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  <div className="text-[10px] flex items-center font-semibold">
                    {contactVisible ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Connection unlocked!
                      </span>
                    ) : isMyContactShared ? (
                      <span className="text-amber-600 flex items-center gap-1 animate-pulse">
                        <Lock className="w-3 h-3" /> Waiting for response...
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-2 bg-gray-50 border-t border-gray-100 flex gap-2 min-h-[46px] items-center justify-center">
                  {contactVisible ? (
                    <>
                      {profile.whatsapp_number && (
                        <button
                          onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`)}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span className="text-[11px] font-bold">WhatsApp</span>
                        </button>
                      )}
                      {profile.linkedin_url && (
                        <button
                          onClick={() => window.open(profile.linkedin_url)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                          title="LinkedIn"
                        >
                          <Briefcase className="w-4 h-4 mr-1" />
                          <span className="text-[11px] font-bold">LinkedIn</span>
                        </button>
                      )}
                      {!profile.whatsapp_number && !profile.linkedin_url && (
                        <div className="flex-1 py-2 text-[10px] text-center text-gray-400 font-medium italic">
                          No links provided
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-2 bg-gray-100 text-gray-400 rounded-xl gap-1 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold tracking-wider uppercase">Contact Gated</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

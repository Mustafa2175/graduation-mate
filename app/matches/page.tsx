'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getMatchesForProfile } from '@/lib/queries/matches'
import { getInitials, TRACK_COLORS, TRACK_LABELS, cn } from '@/lib/utils'
import { MessageCircle, Briefcase } from 'lucide-react'
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

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    setCurrentUserId(user.profileId)

    getMatchesForProfile(user.profileId).then(({ data }) => {
      if (data) setMatches(data)
      setIsLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
            const isP1 = match.profile1.id === currentUserId
            const otherProfile = isP1 ? match.profile2 : match.profile1

            // The query returns joined data. Sometimes PostgREST returns it as an array if it thinks it's a 1-to-many.
            // But since it's a foreign key, it should be an object. Let's handle both just in case.
            const profile = Array.isArray(otherProfile) ? otherProfile[0] : otherProfile
            
            if (!profile) return null

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
                <div className="px-3 py-3 flex-1 flex flex-col justify-center">
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

                {/* Action Buttons */}
                <div className="p-2 bg-gray-50 border-t border-gray-100 flex gap-2">
                  {profile.whatsapp_number && (
                    <button
                      onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`)}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                  {profile.linkedin_url && (
                    <button
                      onClick={() => window.open(profile.linkedin_url)}
                      className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors"
                      title="LinkedIn"
                    >
                      <Briefcase className="w-4 h-4" />
                    </button>
                  )}
                  {!profile.whatsapp_number && !profile.linkedin_url && (
                    <div className="flex-1 py-2 text-[10px] text-center text-gray-400 font-medium italic">
                      No contact info
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

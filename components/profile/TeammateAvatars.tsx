// components/profile/TeammateAvatars.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Teammate {
  id: string
  full_name: string
  avatar_url: string | null
}

const AVATAR_COLORS = [
  'bg-violet-400',
  'bg-blue-400',
  'bg-emerald-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-teal-400',
]

function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

interface TeammateAvatarsProps {
  teamId: string | null
}

export default function TeammateAvatars({ teamId }: TeammateAvatarsProps) {
  const [teammates, setTeammates] = useState<Teammate[]>([])

  useEffect(() => {
    if (!teamId) return

    supabase
      .from('team_members')
      .select('profiles ( id, full_name, avatar_url )')
      .eq('team_id', teamId)
      .then(({ data }) => {
        if (!data) return
        const profiles = data
          .map((m: any) => m.profiles)
          .filter(Boolean) as Teammate[]
        setTeammates(profiles)
      })
  }, [teamId])

  if (!teamId || teammates.length === 0) return null

  const visible = teammates.slice(0, 3)
  const extra = teammates.length - 3

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-gray-400">Team</span>
      <div className="flex -space-x-2">
        {visible.map((t) => (
          <div
            key={t.id}
            className="w-6 h-6 rounded-full ring-2 ring-white overflow-hidden flex items-center justify-center text-[9px] font-bold text-white"
            title={t.full_name}
          >
            {t.avatar_url ? (
              <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(t.full_name)}`}>
                {getInitials(t.full_name)}
              </div>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-6 h-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}

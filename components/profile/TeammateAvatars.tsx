// components/profile/TeammateAvatars.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getInitials, getAvatarBg } from '@/lib/utils'

interface Teammate {
  id: string
  full_name: string
  avatar_url: string | null
}

interface TeammateAvatarsProps {
  teamId: string | null
  preloadedTeammates?: Teammate[]
}

export default function TeammateAvatars({ teamId, preloadedTeammates }: TeammateAvatarsProps) {
  const [teammates, setTeammates] = useState<Teammate[]>([])

  useEffect(() => {
    if (preloadedTeammates) {
      setTeammates(preloadedTeammates)
      return
    }
    if (!teamId) return

    supabase
      .from('team_members')
      .select('profiles ( id, full_name, avatar_url )')
      .eq('team_id', teamId)
      .then(({ data }) => {
        if (!data) return
        const profiles = data
          .map((m: any) => Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)
          .filter(Boolean) as Teammate[]
        setTeammates(profiles)
      })
  }, [teamId, preloadedTeammates])

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
              <div className={`w-full h-full flex items-center justify-center ${getAvatarBg(t.full_name)}`}>
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

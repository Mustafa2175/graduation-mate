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
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-abyssal-ink font-bold">Team</span>
      <div className="flex -space-x-1.5">
        {visible.map((t) => (
          <div
            key={t.id}
            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2 ring-abyssal-ink text-[9px] font-bold text-pure-white"
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
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pure-white text-[9px] font-bold text-abyssal-ink ring-2 ring-abyssal-ink">
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}

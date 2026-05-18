'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSwipe } from '@/hooks/useSwipe'
import SwipeCard from '@/components/discover/SwipeCard'
import SwipeButtons from '@/components/discover/SwipeButtons'
import Button from '@/components/ui/Button'
import { getInitials } from '@/lib/utils'
import type { Track } from '@/types'

type TrackFilter = Track | 'ANY'
type StatusFilter = 'ALL' | 'LOOKING' | 'LOOKING_FOR_MORE'

export default function DiscoverPage() {
  const router = useRouter()
  const { getUser } = useCurrentUser()
  const { profiles, currentIndex, isLoading, matchedProfile, handleSwipe, clearMatch } = useSwipe()
  
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('ANY')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  
  const childRefs = useRef<any[]>([])

  useEffect(() => {
    if (!getUser()) {
      router.replace('/login')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter profiles based on selected filters, and keep only those up to currentIndex
  const remainingFiltered = useMemo(() => {
    const remaining = profiles.filter((_, i) => i <= currentIndex)
    return remaining.filter(p => {
      if (trackFilter !== 'ANY' && p.track !== trackFilter) return false
      if (statusFilter === 'LOOKING' && p.team_status !== 'LOOKING') return false
      if (statusFilter === 'LOOKING_FOR_MORE' && p.team_status !== 'LOOKING_FOR_MORE') return false
      return true
    })
  }, [profiles, currentIndex, trackFilter, statusFilter])

  const currentProfile = remainingFiltered.length > 0 ? remainingFiltered[remainingFiltered.length - 1] : null

  const swipe = async (dir: 'left' | 'right') => {
    if (!currentProfile) return
    const topIndex = remainingFiltered.length - 1
    const ref = childRefs.current[topIndex]
    if (ref && ref.swipe) {
      // This animates the card off screen and triggers the onSwipe callback
      await ref.swipe(dir) 
    } else {
      handleSwipe(dir === 'right' ? 'RIGHT' : 'LEFT', currentProfile)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] p-6 animate-pulse">
        <div className="flex gap-2 mb-6">
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
        </div>
        <div className="flex-1 bg-gray-200 rounded-2xl mb-8" />
        <div className="flex justify-center gap-8 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-[#ededed] p-3 sm:p-5 rounded-3xl border border-neutral-200/50 flex flex-col justify-start relative overflow-hidden font-sans">
      
      {/* Top Header & Badge (Convix Style) */}
      <div className="text-center mb-5 pt-2 shrink-0 flex flex-col items-center select-none">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm text-[13px] border border-neutral-100">
          <span className="w-2 h-2 rounded-full bg-[#ef4d23]" />
          <span className="font-semibold text-neutral-800 tracking-wide text-[10px] uppercase font-sans">Convix Matchmaking</span>
        </div>
        <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-[#0b0f1a] tracking-tight mt-3">
          Shaping <span className="font-instrument italic text-[1.15em] font-normal leading-none text-[#ef4d23]">Teams</span> of tomorrow
        </h1>
      </div>

      {/* Filters pill-style (Convix Pill) */}
      <div className="flex gap-3 mb-6 shrink-0 relative bg-white/70 p-2 rounded-2xl border border-neutral-200/50 backdrop-blur-sm shadow-sm">
        <select
          value={trackFilter}
          onChange={e => setTrackFilter(e.target.value as TrackFilter)}
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#ef4d23] transition-all cursor-pointer shadow-sm"
        >
          <option value="ANY">Any Track</option>
          <option value="AI">AI</option>
          <option value="DATA_SCIENCE">Data Science</option>
          <option value="CYBERSECURITY">Cybersecurity</option>
          <option value="WEB_DEV">Web Dev</option>
          <option value="MOBILE_DEV">Mobile Dev</option>
          <option value="OTHER">Other</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#ef4d23] transition-all cursor-pointer shadow-sm"
        >
          <option value="ALL">Any Status</option>
          <option value="LOOKING">Looking for team</option>
          <option value="LOOKING_FOR_MORE">Looking for more</option>
        </select>
      </div>

      {/* Swipe Area */}
      <div className="relative flex-1 w-full max-w-sm mx-auto min-h-[360px]">
        {remainingFiltered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 p-6 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-[#f5f2ee] rounded-full flex items-center justify-center border border-neutral-100 shadow-inner">
              <span className="text-2xl text-[#ef4d23]">✨</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b0f1a]">You've seen everyone!</h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">Check back later or adjust your filters to find more compatible teammates.</p>
            </div>
          </div>
        ) : (
          remainingFiltered.map((profile, i) => {
            const isTop = i === remainingFiltered.length - 1
            return (
              <div
                key={profile.id}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: i }}
              >
                <div className="pointer-events-auto w-full h-full">
                  <SwipeCard
                    ref={(el) => { childRefs.current[i] = el }}
                    profile={profile}
                    onSwipe={(dir) => handleSwipe(dir, profile)}
                    isTop={isTop}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Buttons */}
      <div className="shrink-0 mt-6 mb-2">
        <SwipeButtons
          onLeft={() => swipe('left')}
          onRight={() => swipe('right')}
          disabled={!currentProfile}
        />
      </div>

      {/* Match Modal */}
      {matchedProfile && (
        <div className="fixed inset-0 z-50 bg-[#0b0f1a]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#f5f2ee] rounded-[2rem] border border-neutral-200/60 w-full max-w-sm p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[#0b0f1a] tracking-tight">
                It's a <span className="font-instrument italic text-[1.1em] font-normal leading-none text-[#ef4d23]">Match</span>!
              </h2>
              <p className="text-xs text-neutral-500 font-medium">You and {matchedProfile.full_name} are ready to build the future.</p>
            </div>
            
            <div className="flex justify-center items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-white ring-4 ring-white shadow-lg overflow-hidden text-2xl font-bold text-gray-700">
                  {matchedProfile.avatar_url ? (
                    <img src={matchedProfile.avatar_url} alt="" className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    getInitials(matchedProfile.full_name)
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ef4d23] rounded-full border-2 border-white flex items-center justify-center text-white text-xs shadow-md animate-bounce">
                  ❤️
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {matchedProfile.whatsapp_number && (
                <button
                  onClick={() => window.open(`https://wa.me/${matchedProfile.whatsapp_number!.replace(/\D/g, '')}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#ef4d23] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ef4d23]/90 transition-all shadow-[0_4px_16px_rgba(239,77,35,0.25)] cursor-pointer"
                >
                  Message on WhatsApp
                </button>
              )}
              {matchedProfile.linkedin_url && (
                <button
                  onClick={() => window.open(matchedProfile.linkedin_url!)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0b0f1a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0b0f1a]/90 transition-all shadow-md cursor-pointer"
                >
                  View LinkedIn
                </button>
              )}
              <button
                onClick={clearMatch}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-[#0b0f1a] transition-colors"
              >
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

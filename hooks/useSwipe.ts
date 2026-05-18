// hooks/useSwipe.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import { useCurrentUser } from './useCurrentUser'
import { getDiscoverProfiles } from '@/lib/queries/profiles'
import { getSwipedIds, insertSwipe, checkMutualMatch, resetSwipes } from '@/lib/queries/swipes'
import { createMatch } from '@/lib/queries/matches'
import type { Profile } from '@/types'

export function useSwipe() {
  const { getUser } = useCurrentUser()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(true)
  const currentProfileId = useRef<string | null>(null)

  const loadProfiles = async () => {
    const user = getUser()
    if (!user) return
    currentProfileId.current = user.profileId
    setIsLoading(true)
    try {
      const swipedIds = await getSwipedIds(user.profileId)
      const { data } = await getDiscoverProfiles(user.profileId, swipedIds)
      if (data) {
        setProfiles(data as Profile[])
        setCurrentIndex(data.length - 1)
      }
    } catch (e) {
      console.error('Failed to load profiles', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipe = async (direction: 'RIGHT' | 'LEFT', profile: Profile) => {
    const pid = currentProfileId.current
    if (!pid) return

    setCurrentIndex(prev => prev - 1)

    try {
      await insertSwipe(pid, profile.id, direction)

      if (direction === 'RIGHT') {
        // Automatically simulate a return swipe right from the mock profile to create a match
        await insertSwipe(profile.id, pid, 'RIGHT')

        const isMutual = await checkMutualMatch(pid, profile.id)
        if (isMutual) {
          await createMatch(pid, profile.id)
        }
      }
    } catch (e) {
      console.error('Swipe error', e)
    }
  }

  const resetSwipeQueue = async () => {
    const user = getUser()
    if (!user) return
    setIsLoading(true)
    try {
      await resetSwipes(user.profileId)
      const { data } = await getDiscoverProfiles(user.profileId, [])
      if (data) {
        setProfiles(data as Profile[])
        setCurrentIndex(data.length - 1)
      }
    } catch (e) {
      console.error('Failed to reset swipes', e)
    } finally {
      setIsLoading(false)
    }
  }

  return { profiles, currentIndex, isLoading, handleSwipe, resetSwipeQueue }
}

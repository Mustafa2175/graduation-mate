import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useSwipe } from '../useSwipe'
import * as authHook from '../useAuth'
import * as profilesQueries from '@/lib/queries/profiles'
import * as swipesQueries from '@/lib/queries/swipes'
import * as matchesQueries from '@/lib/queries/matches'

vi.mock('../useAuth')
vi.mock('@/lib/queries/profiles')
vi.mock('@/lib/queries/swipes')
vi.mock('@/lib/queries/matches')

describe('useSwipe hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { profileId: 'test-id', fullName: 'Test User' },
      isLoading: false,
      getFreshUser: vi.fn().mockResolvedValue({ profileId: 'test-id', fullName: 'Test User' }),
      setCurrentUser: vi.fn(),
      clearCurrentUser: vi.fn().mockResolvedValue({ error: null }),
    })
    
    vi.mocked(swipesQueries.getSwipedIds).mockResolvedValue(['swiped-1'])
    vi.mocked(profilesQueries.getDiscoverProfiles).mockResolvedValue({
      data: [
        { id: 'profile-1', full_name: 'Profile 1', created_at: '2023-01-01T00:00:00Z' },
        { id: 'profile-2', full_name: 'Profile 2', created_at: '2023-01-02T00:00:00Z' }
      ] as any,
      error: null
    })
    vi.mocked(swipesQueries.insertSwipe).mockResolvedValue({ data: null, error: null } as any)
    vi.mocked(swipesQueries.checkMutualMatch).mockResolvedValue(false)
    vi.mocked(matchesQueries.createMatch).mockResolvedValue({ data: null, error: null } as any)
  })

  it('should initialize and load profiles', async () => {
    const { result } = renderHook(() => useSwipe())
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.profiles.length).toBe(2)
    expect(result.current.currentIndex).toBe(1) // 2 profiles, index is length - 1
    expect(result.current.hasMore).toBe(false) // Fetched 2 < 20
  })

  it('should handle swipe right with a mutual match', async () => {
    vi.mocked(swipesQueries.checkMutualMatch).mockResolvedValue(true)
    
    const { result } = renderHook(() => useSwipe())
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    const profileToSwipe = result.current.profiles[result.current.currentIndex]
    
    await act(async () => {
      await result.current.handleSwipe('RIGHT', profileToSwipe)
    })
    
    expect(result.current.currentIndex).toBe(0)
    expect(swipesQueries.insertSwipe).toHaveBeenCalledWith('test-id', 'profile-2', 'RIGHT')
    expect(swipesQueries.checkMutualMatch).toHaveBeenCalledWith('test-id', 'profile-2')
    expect(matchesQueries.createMatch).toHaveBeenCalledWith('test-id', 'profile-2')
  })

  it('should handle swipe left without checking mutual match', async () => {
    const { result } = renderHook(() => useSwipe())
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    const profileToSwipe = result.current.profiles[result.current.currentIndex]
    
    await act(async () => {
      await result.current.handleSwipe('LEFT', profileToSwipe)
    })
    
    expect(result.current.currentIndex).toBe(0)
    expect(swipesQueries.insertSwipe).toHaveBeenCalledWith('test-id', 'profile-2', 'LEFT')
    expect(swipesQueries.checkMutualMatch).not.toHaveBeenCalled()
  })
})

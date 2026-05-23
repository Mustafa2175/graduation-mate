import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../useAuth'
import { supabase } from '@/lib/supabase/client'
import React from 'react'

// Wrap hooks with AuthProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const localStorageMock = (function () {
      let store: Record<string, string> = {}
      return {
        getItem(key: string) {
          return store[key] || null
        },
        setItem(key: string, value: string) {
          store[key] = value.toString()
        },
        removeItem(key: string) {
          delete store[key]
        },
        clear() {
          store = {}
        }
      }
    })()
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    window.localStorage.clear()
    
    // Default mock implementation
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-id', user_metadata: { full_name: 'Test User' } } },
      error: null
    } as any)
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Test User' }, error: null }),
    } as any)
  })

  it('should initialize with loading state and fetch user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.isLoading).toBe(true)
    
    // Wait for the initial fetch to complete
    await act(async () => {
      // Small delay to allow Promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toEqual({
      profileId: 'test-id',
      fullName: 'Test User'
    })
    expect(window.localStorage.getItem('teamup_user')).toBe(JSON.stringify({
      profileId: 'test-id',
      fullName: 'Test User'
    }))
  })

  it('should handle sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.user).toBeTruthy()
    
    await act(async () => {
      await result.current.clearCurrentUser()
    })
    
    expect(result.current.user).toBeNull()
    expect(window.localStorage.getItem('teamup_user')).toBeNull()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('should manually set current user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    act(() => {
      result.current.setCurrentUser('new-id', 'New User')
    })
    
    expect(result.current.user).toEqual({
      profileId: 'new-id',
      fullName: 'New User'
    })
    expect(window.localStorage.getItem('teamup_user')).toBe(JSON.stringify({
      profileId: 'new-id',
      fullName: 'New User'
    }))
  })
})

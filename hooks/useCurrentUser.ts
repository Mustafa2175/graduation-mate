// hooks/useCurrentUser.ts
const STORAGE_KEY = 'teamup_user'

interface StoredUser {
  profileId: string
  fullName: string
}

export function useCurrentUser() {
  const getUser = (): StoredUser | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  const setCurrentUser = (profileId: string, fullName: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profileId, fullName }))
  }

  const clearCurrentUser = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  return { getUser, setCurrentUser, clearCurrentUser }
}

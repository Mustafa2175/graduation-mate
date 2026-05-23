// hooks/useCurrentUser.ts
"use client";

import { useAuth } from "@/components/providers/AuthProvider";

const STORAGE_KEY = "teamup_user";
const STORAGE_EVENT = "teamup_user_changed";

interface StoredUser {
  profileId: string;
  fullName: string;
}

export function useCurrentUser() {
  const { user, refreshUser, logout } = useAuth();

  const getUser = (): StoredUser | null => {
    if (user) return user;
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const getFreshUser = async (): Promise<StoredUser | null> => {
    return refreshUser();
  };

  const setCurrentUser = (profileId: string, fullName: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profileId, fullName }));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  const clearCurrentUser = async () => {
    return logout();
  };

  const onUserChanged = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(STORAGE_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {
      window.removeEventListener(STORAGE_EVENT, callback);
      window.removeEventListener("storage", callback);
    };
  };

  return {
    getUser,
    getFreshUser,
    setCurrentUser,
    clearCurrentUser,
    onUserChanged,
  };
}

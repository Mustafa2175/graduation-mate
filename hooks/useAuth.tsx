"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "teamup_user";
const LOGOUT_KEY = "teamup_logout_in_progress";
const LOGOUT_EXPIRY_MS = 30000; // 30 seconds

export interface StoredUser {
  profileId: string;
  fullName: string;
}

interface AuthContextType {
  user: StoredUser | null;
  isLoading: boolean;
  getFreshUser: () => Promise<StoredUser | null>;
  setCurrentUser: (profileId: string, fullName: string) => void;
  clearCurrentUser: () => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isLogoutInProgress() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(LOGOUT_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > LOGOUT_EXPIRY_MS) {
      localStorage.removeItem(LOGOUT_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(LOGOUT_KEY);
    return false;
  }
}

function markLogoutInProgress() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGOUT_KEY, JSON.stringify({ timestamp: Date.now() }));
}

function clearLogoutInProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGOUT_KEY);
}

function readCachedUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.profileId || !parsed?.fullName) return null;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeCachedUser(user: StoredUser) {
  if (typeof window === "undefined") return;
  clearLogoutInProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function removeCachedUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (): Promise<StoredUser | null> => {
    if (isLogoutInProgress()) {
      removeCachedUser();
      setUserState(null);
      return null;
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      removeCachedUser();
      setUserState(null);
      return null;
    }

    const cached = readCachedUser();
    if (cached?.profileId === authUser.id) {
      setUserState(cached);
      return cached;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to hydrate cached user profile:", profileError);
    }

    const freshUser = {
      profileId: authUser.id,
      fullName: profile?.full_name || authUser?.user_metadata?.full_name || authUser?.email || "User",
    };

    writeCachedUser(freshUser);
    setUserState(freshUser);
    return freshUser;
  };

  useEffect(() => {
    // Initial fetch
    fetchUser().finally(() => setIsLoading(false));

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        removeCachedUser();
        setUserState(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await fetchUser();
      }
    });

    // Listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            setUserState(JSON.parse(e.newValue));
          } catch {
            setUserState(null);
          }
        } else {
          setUserState(null);
        }
      } else if (e.key === LOGOUT_KEY && e.newValue) {
        setUserState(null);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getFreshUser = async () => {
    return await fetchUser();
  };

  const setCurrentUser = (profileId: string, fullName: string) => {
    const newUser = { profileId, fullName };
    writeCachedUser(newUser);
    setUserState(newUser);
  };

  const clearCurrentUser = async () => {
    markLogoutInProgress();
    removeCachedUser();
    setUserState(null);

    let signOutError: unknown = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const result = await Promise.race([
        supabase.auth.signOut(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Supabase signOut timed out")), 10000);
        }),
      ]);

      if (timeoutId) clearTimeout(timeoutId);
      if (result && result.error) throw result.error;
    } catch (error) {
      signOutError = error;
      console.error("[auth] logout:signOut failed", error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      removeCachedUser();
    }

    return { error: signOutError };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, getFreshUser, setCurrentUser, clearCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

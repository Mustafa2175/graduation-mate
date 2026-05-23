"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

interface StoredUser {
  profileId: string;
  fullName: string;
}

interface AuthContextType {
  user: StoredUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<StoredUser | null>;
  logout: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "teamup_user";
const LOGOUT_KEY = "teamup_logout_in_progress";

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
  localStorage.removeItem(LOGOUT_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function removeCachedUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronously hydrate from cache on mount for 0ms visual delay
  useEffect(() => {
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
    }
  }, []);

  const refreshUser = async (): Promise<StoredUser | null> => {
    if (typeof window !== "undefined" && localStorage.getItem(LOGOUT_KEY) === "true") {
      removeCachedUser();
      setUser(null);
      setIsLoading(false);
      return null;
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      removeCachedUser();
      setUser(null);
      setIsLoading(false);
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    const freshUser = {
      profileId: authUser.id,
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email ||
        "User",
    };

    writeCachedUser(freshUser);
    setUser(freshUser);
    setIsLoading(false);
    return freshUser;
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOGOUT_KEY, "true");
    }
    removeCachedUser();
    setUser(null);

    let signOutError: any = null;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) signOutError = error;
    } catch (e) {
      signOutError = e;
    } finally {
      removeCachedUser();
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOGOUT_KEY);
      }
    }
    return { error: signOutError };
  };

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        refreshUser();
      } else if (event === "SIGNED_OUT") {
        removeCachedUser();
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
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

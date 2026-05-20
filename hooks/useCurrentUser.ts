// hooks/useCurrentUser.ts
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "teamup_user";
const LOGOUT_KEY = "teamup_logout_in_progress";
const STORAGE_EVENT = "teamup_user_changed";

interface StoredUser {
  profileId: string;
  fullName: string;
}

function notifyUserChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function isLogoutInProgress() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGOUT_KEY) === "true";
}

function markLogoutInProgress() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGOUT_KEY, "true");
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
  notifyUserChanged();
}

function removeCachedUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  notifyUserChanged();
}

export function useCurrentUser() {
  const getUser = (): StoredUser | null => readCachedUser();

  const getFreshUser = async (): Promise<StoredUser | null> => {
    if (isLogoutInProgress()) {
      removeCachedUser();
      return null;
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      removeCachedUser();
      return null;
    }

    const cached = readCachedUser();
    if (cached?.profileId === authUser.id) {
      return cached;
    }

    const { data: profile, error: profileError } = await supabase
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

    if (profileError) {
      console.error("Failed to hydrate cached user profile:", profileError);
    }

    writeCachedUser(freshUser);
    return freshUser;
  };

  const setCurrentUser = (profileId: string, fullName: string) => {
    writeCachedUser({ profileId, fullName });
  };

  const clearCurrentUser = async () => {
    // Mark logout before notifying subscribers. Otherwise listeners like
    // BottomNav can call getFreshUser() while Supabase still has a session and
    // accidentally rehydrate stale localStorage during the sign-out race.
    markLogoutInProgress();
    removeCachedUser();

    let signOutError: unknown = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const result = await Promise.race([
        supabase.auth.signOut(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("Supabase signOut timed out")),
            10000,
          );
        }),
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      signOutError = error;
      console.error("[auth] logout:signOut failed", error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      removeCachedUser();
    }

    return { error: signOutError };
  };

  const onUserChanged = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(STORAGE_EVENT, callback);
    window.addEventListener("storage", callback);
    const { data } = supabase.auth.onAuthStateChange(() => callback());

    return () => {
      window.removeEventListener(STORAGE_EVENT, callback);
      window.removeEventListener("storage", callback);
      data.subscription.unsubscribe();
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

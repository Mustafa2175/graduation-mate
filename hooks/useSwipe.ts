// hooks/useSwipe.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getDiscoverProfiles } from "@/lib/queries/profiles";
import {
  getSwipedIds,
  insertSwipe,
  checkMutualMatch,
  resetSwipes,
} from "@/lib/queries/swipes";
import { createMatch } from "@/lib/queries/matches";
import type { Profile } from "@/types";
import { toast } from "react-hot-toast";

export function useSwipe() {
  const { getFreshUser, isLoading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currentProfileId = useRef<string | null>(null);
  const nextCursor = useRef<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (authLoading) return;

    const user = await getFreshUser();
    if (!user) {
      // No localStorage session yet (e.g. just signed up but setCurrentUser
      // wasn't called). Exit the loading state so the discover page doesn't
      // hang on a skeleton indefinitely, then let the discover-page redirect
      // handle navigation.
      setIsLoading(false);
      return;
    }
    currentProfileId.current = user.profileId;
    setLoadError(null);
    setIsLoading(true);
    try {
      const swipedIds = await getSwipedIds(user.profileId);
      const { data, error } = await getDiscoverProfiles(
        user.profileId,
        swipedIds,
        20
      );
      if (error) throw error;
      if (data && data.length > 0) {
        setProfiles(data as Profile[]);
        setCurrentIndex(data.length - 1);
        nextCursor.current = data[data.length - 1].created_at;
        setHasMore(data.length === 20);
      } else {
        setProfiles([]);
        setCurrentIndex(-1);
        setHasMore(false);
      }
    } catch (e) {
      setLoadError(
        "Could not load discover profiles. Please refresh and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, getFreshUser]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = useCallback(async (direction: "RIGHT" | "LEFT", profile: Profile) => {
    const pid = currentProfileId.current;
    if (!pid) return;

    setCurrentIndex((prev) => prev - 1);

    try {
      const { error: swipeError } = await insertSwipe(pid, profile.id, direction);
      
      if (swipeError && swipeError.code !== '23505') {
        setCurrentIndex((prev) => prev + 1);
        toast.error("Failed to swipe. Please try again.");
        return;
      }

      if (direction === "RIGHT") {
        const isMutual = await checkMutualMatch(pid, profile.id);
        if (isMutual) {
          const { error: matchError } = await createMatch(pid, profile.id);
          if (matchError && matchError.code !== '23505') {
            toast.error("Match created but experienced an error.");
          } else {
            toast.success(`You matched with ${profile.full_name}!`);
          }
        }
      }
    } catch (e) {
      // Catch any unexpected exceptions
      setCurrentIndex((prev) => prev + 1);
      toast.error("Failed to swipe. Please try again.");
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || !nextCursor.current || !currentProfileId.current) return;
    
    setIsFetchingMore(true);
    try {
      const swipedIds = await getSwipedIds(currentProfileId.current);
      // NOTE: Cursor collision risk. If two profiles share the exact same created_at timestamp,
      // the .lt() filter in getDiscoverProfiles will skip both. A compound cursor (created_at + id) 
      // would be safer, but given our current scale, we defer this complexity.
      const { data, error } = await getDiscoverProfiles(
        currentProfileId.current,
        swipedIds,
        20,
        nextCursor.current
      );
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Prepend new batch so it appears under the current cards
        setProfiles(prev => [...(data as Profile[]), ...prev]);
        setCurrentIndex(prev => prev + data.length);
        nextCursor.current = data[data.length - 1].created_at ?? null;
        setHasMore(data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      // UX improvement: Re-allow fetch attempts if a transient network error occurred
      setHasMore(true);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore]);

  const resetSwipeQueue = useCallback(async () => {
    const user = await getFreshUser();
    if (!user) return;
    setLoadError(null);
    setIsLoading(true);
    try {
      await resetSwipes(user.profileId);
      nextCursor.current = null;
      setHasMore(true);
      const { data, error } = await getDiscoverProfiles(user.profileId, [], 20);
      if (error) throw error;
      if (data && data.length > 0) {
        setProfiles(data as Profile[]);
        setCurrentIndex(data.length - 1);
        nextCursor.current = data[data.length - 1].created_at ?? null;
        setHasMore(data.length === 20);
      } else {
        setProfiles([]);
        setCurrentIndex(-1);
        setHasMore(false);
      }
    } catch (e) {
      setLoadError(
        "Could not reset discover profiles. Please refresh and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getFreshUser]);

  return {
    profiles,
    currentIndex,
    isLoading,
    isFetchingMore,
    hasMore,
    loadError,
    handleSwipe,
    resetSwipeQueue,
    fetchMore,
  };
}

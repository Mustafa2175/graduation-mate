// hooks/useSwipe.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "./useCurrentUser";
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

export function useSwipe(filterTrack?: string, filterSkills?: string[]) {
  const { getFreshUser } = useCurrentUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currentProfileId = useRef<string | null>(null);

  const loadProfiles = async () => {
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
        undefined,
        undefined,
        filterTrack,
        filterSkills
      );
      if (error) throw error;
      if (data) {
        setProfiles(data as Profile[]);
        setCurrentIndex(data.length - 1);
      }
    } catch (e) {
      console.error("Failed to load profiles", e);
      setLoadError(
        "Could not load discover profiles. Please refresh and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [filterTrack, filterSkills]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipe = async (direction: "RIGHT" | "LEFT", profile: Profile) => {
    const pid = currentProfileId.current;
    if (!pid) return;

    setCurrentIndex((prev) => prev - 1);

    try {
      await insertSwipe(pid, profile.id, direction);

      if (direction === "RIGHT") {
        const isMutual = await checkMutualMatch(pid, profile.id);
        if (isMutual) {
          await createMatch(pid, profile.id);
          toast.success(`You matched with ${profile.full_name}!`);
        }
      }
    } catch (e) {
      console.error("Swipe error", e);
    }
  };

  const resetSwipeQueue = async () => {
    const user = await getFreshUser();
    if (!user) return;
    setLoadError(null);
    setIsLoading(true);
    try {
      await resetSwipes(user.profileId);
      const { data, error } = await getDiscoverProfiles(user.profileId, []);
      if (error) throw error;
      if (data) {
        setProfiles(data as Profile[]);
        setCurrentIndex(data.length - 1);
      }
    } catch (e) {
      console.error("Failed to reset swipes", e);
      setLoadError(
        "Could not reset discover profiles. Please refresh and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profiles,
    currentIndex,
    isLoading,
    loadError,
    handleSwipe,
    resetSwipeQueue,
  };
}

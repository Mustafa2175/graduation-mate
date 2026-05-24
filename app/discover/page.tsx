"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSwipe } from "@/hooks/useSwipe";
import SwipeCard from "@/components/discover/SwipeCard";
import SwipeButtons from "@/components/discover/SwipeButtons";

export default function DiscoverPage() {
  const router = useRouter();
  const { getFreshUser } = useAuth();
  const {
    profiles,
    currentIndex,
    isLoading,
    isFetchingMore,
    hasMore,
    loadError,
    handleSwipe,
    resetSwipeQueue,
    fetchMore,
  } = useSwipe();
  const [authChecked, setAuthChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const childRefs = useRef<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const user = await getFreshUser();
      if (!isMounted) return;
      if (!user) {
        setIsRedirecting(true);
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentIndex <= 4 && currentIndex >= 0 && hasMore && !isFetchingMore) {
      fetchMore();
    }
  }, [currentIndex, hasMore, isFetchingMore, fetchMore]);

  const remainingFiltered = useMemo(() => {
    return profiles.filter((_, i) => i <= currentIndex);
  }, [profiles, currentIndex]);

  const currentProfile =
    remainingFiltered.length > 0
      ? remainingFiltered[remainingFiltered.length - 1]
      : null;

  const swipe = async (dir: "left" | "right") => {
    if (!currentProfile) return;
    const topIndex = remainingFiltered.length - 1;
    const ref = childRefs.current[topIndex];
    if (ref && ref.swipe) {
      await ref.swipe(dir);
    } else {
      handleSwipe(dir === "right" ? "RIGHT" : "LEFT", currentProfile);
    }
  };

  if (!authChecked || isRedirecting || isLoading) {
    return (
      <div className="gm-page flex flex-col">
        <div className="gm-skeleton mb-6 h-10 w-full" />
        <div className="gm-skeleton mb-8 flex-1" />
        <div className="mb-4 flex justify-center gap-4">
          <div className="gm-skeleton h-14 w-14 rounded-md" />
          <div className="gm-skeleton h-14 w-14 rounded-md" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gm-page flex items-center justify-center">
        <div className="gm-panel max-w-sm space-y-4 p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">
            Discover could not load
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="gm-btn gm-btn-primary"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gm-page flex flex-col justify-start overflow-hidden bg-basalt-canvas">
      <div className="mb-6 shrink-0 select-none">
        <div className="gm-badge bg-pixel-glare border-2 border-abyssal-ink shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]">
          <span className="gm-status-dot" />
          <span>Trend Signals</span>
        </div>
        <h1 className="mt-3 text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">
          Trend Intelligence Lab
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-abyssal-ink font-semibold">
          Swipe through AI-generated content concepts curated from real-time social signals. Save ideas directly to your Brand Vault.
        </p>
      </div>

      <div className="relative mx-auto min-h-[360px] w-full max-w-sm flex-1">
        {remainingFiltered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 p-8 text-center bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] animate-reveal">
            <div className="space-y-3">
              <h3 className="text-3xl font-display tracking-wider uppercase leading-none text-abyssal-ink">
                Trend queue complete
              </h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-abyssal-ink font-semibold opacity-85">
                You reached the end of the visual content suggestion list. Refresh trend intelligence to parse active signals again.
              </p>
            </div>
            <button
              onClick={resetSwipeQueue}
              className="gm-btn gm-btn-primary cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
            >
              Refresh Trends
            </button>
          </div>
        ) : (
          <>
            {isFetchingMore && (
              <div className="gm-card absolute inset-0 z-[-1] flex flex-col p-4">
                <div className="gm-skeleton mb-6 h-10 w-full" />
                <div className="gm-skeleton mb-8 flex-1" />
              </div>
            )}
            {remainingFiltered.map((profile, i) => {
              const isTop = i === remainingFiltered.length - 1;
              return (
                <div
                  key={profile.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: i }}
                >
                  <div className="pointer-events-auto h-full w-full">
                    <SwipeCard
                      ref={(el) => {
                        childRefs.current[i] = el;
                      }}
                      profile={profile}
                      onSwipe={(dir) => handleSwipe(dir, profile)}
                      isTop={isTop}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="mb-2 mt-6 shrink-0">
        <SwipeButtons
          onLeft={() => swipe("left")}
          onRight={() => swipe("right")}
          disabled={!currentProfile}
        />
      </div>
    </div>
  );
}

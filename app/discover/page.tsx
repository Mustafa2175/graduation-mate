"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSwipe } from "@/hooks/useSwipe";
import SwipeCard from "@/components/discover/SwipeCard";
import SwipeButtons from "@/components/discover/SwipeButtons";

export default function DiscoverPage() {
  const router = useRouter();
  const { getFreshUser } = useCurrentUser();
  const {
    profiles,
    currentIndex,
    isLoading,
    loadError,
    handleSwipe,
    resetSwipeQueue,
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

  // Filter profiles based on selected filters, and keep only those up to currentIndex
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
      // This animates the card off screen and triggers the onSwipe callback
      await ref.swipe(dir);
    } else {
      handleSwipe(dir === "right" ? "RIGHT" : "LEFT", currentProfile);
    }
  };

  if (!authChecked || isRedirecting || isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] p-6 ">
        <div className="h-10 bg-gray-200 rounded-xl mb-6 w-full" />
        <div className="flex-1 bg-gray-200 rounded-2xl mb-8" />
        <div className="flex justify-center gap-8 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-100px)] w-full bg-[#ededed] p-6 rounded-3xl border border-neutral-200/50 flex items-center justify-center font-sans">
        <div className="bg-white rounded-3xl border border-red-100 p-8 text-center shadow-sm max-w-sm space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-semibold text-xl text-[#0b0f1a]">
            Discover could not load
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {loadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand)] px-6 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-[var(--color-brand)]/95 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-[#ededed] p-4 sm:p-6 rounded-3xl border border-neutral-200/50 flex flex-col justify-start relative overflow-hidden font-sans">
      {/* Top Header & Badge */}
      <div className="text-center mb-3 pt-1 shrink-0 flex flex-col items-center select-none">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm text-[13px] border border-neutral-100">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
          <span className="font-semibold text-neutral-800 tracking-wide text-[10px] uppercase font-sans">
            TeamUp Network
          </span>
        </div>
        <h1 className="font-sans font-semibold text-2xl sm:text-3xl text-[#0b0f1a] tracking-tight mt-2">
          Find your ideal{" "}
          <span className="font-instrument italic text-[1.15em] font-normal leading-none text-[var(--color-brand)]">
            Teammates
          </span>
        </h1>
      </div>

      {/* Swipe Area */}
      <div className="relative flex-1 w-full max-w-sm mx-auto min-h-[360px]">
        {remainingFiltered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 bg-white/85 backdrop-blur-md rounded-3xl border border-neutral-200/50 p-8 shadow-sm animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100 ">
              <span className="text-3xl text-[var(--color-brand)]">✨</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl text-[#0b0f1a] tracking-tight">
                You've seen everyone!
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                You have reached the end of the student list. To ensure your
                queue is never empty, reset the queue below to start swiping all
                users again!
              </p>
            </div>
            <button
              onClick={resetSwipeQueue}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-8 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-[var(--color-brand)]/95 transition-all shadow-[0_4px_16px_rgba(8,113,231,0.2)] cursor-pointer"
            >
              🔄 Reset Queue & Swipe Again
            </button>
          </div>
        ) : (
          remainingFiltered.map((profile, i) => {
            const isTop = i === remainingFiltered.length - 1;
            return (
              <div
                key={profile.id}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: i }}
              >
                <div className="pointer-events-auto w-full h-full">
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
          })
        )}
      </div>

      {/* Buttons */}
      <div className="shrink-0 mt-6 mb-2">
        <SwipeButtons
          onLeft={() => swipe("left")}
          onRight={() => swipe("right")}
          disabled={!currentProfile}
        />
      </div>
    </div>
  );
}

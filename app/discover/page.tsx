"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSwipe } from "@/hooks/useSwipe";
import SwipeCard from "@/components/discover/SwipeCard";
import SwipeButtons from "@/components/discover/SwipeButtons";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TRACK_OPTIONS, SUGGESTED_SKILLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function DiscoverPage() {
  const router = useRouter();
  const { getFreshUser } = useCurrentUser();

  const [filterTrack, setFilterTrack] = useState<string>("");
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    profiles,
    currentIndex,
    isLoading,
    loadError,
    handleSwipe,
    resetSwipeQueue,
  } = useSwipe(filterTrack, filterSkills);
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

  const toggleSkill = (skill: string) => {
    setFilterSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const clearAllFilters = () => {
    setFilterTrack("");
    setFilterSkills([]);
    setSearchTerm("");
  };

  // Filter profiles based on selected filters, and keep only those up to currentIndex
  const remainingFiltered = useMemo(() => {
    let filtered = profiles.filter((_, i) => i <= currentIndex);
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.full_name && p.full_name.toLowerCase().includes(term)) ||
          (p.bio && p.bio.toLowerCase().includes(term)) ||
          (p.department && p.department.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [profiles, currentIndex, searchTerm]);

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

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-neutral-200/60 rounded-2xl shadow-sm text-xs font-semibold text-neutral-800 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand)]" />
          {isFilterOpen ? "Hide Filters" : "Filter Teammates"}
          {(filterTrack || filterSkills.length > 0 || searchTerm) && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold text-white bg-[var(--color-brand)] rounded-full">
              {(filterTrack ? 1 : 0) + filterSkills.length + (searchTerm ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Discover Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm mx-auto overflow-hidden shrink-0"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-neutral-200/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#0b0f1a]">Discover Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-neutral-400 hover:text-[var(--color-brand)] transition-colors font-medium cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Name/Keywords Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-450" />
                <input
                  type="text"
                  placeholder="Search by name, department, bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-neutral-50/50 focus:bg-white border border-neutral-200/60 rounded-2xl text-xs placeholder-neutral-450 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-450 hover:text-neutral-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Track Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                  Academic Track / Focus
                </label>
                <div className="relative">
                  <select
                    value={filterTrack}
                    onChange={(e) => setFilterTrack(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all appearance-none cursor-pointer text-neutral-800"
                  >
                    <option value="">Any Track Specialization</option>
                    {TRACK_OPTIONS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-neutral-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Skills Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                  Teammate Skills
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {SUGGESTED_SKILLS.map((skill) => {
                    const isSelected = filterSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 cursor-pointer border",
                          isSelected
                            ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white shadow-[0_2px_8px_rgba(8,113,231,0.2)] font-semibold"
                            : "bg-neutral-50 border-neutral-250 hover:bg-neutral-100/70 text-neutral-600"
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Area */}
      <div className="relative flex-1 w-full max-w-sm mx-auto min-h-[360px]">
        {remainingFiltered.length === 0 ? (
          profiles.length > 0 && (searchTerm || filterTrack || filterSkills.length > 0) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 bg-white/85 backdrop-blur-md rounded-3xl border border-neutral-200/50 p-8 shadow-sm animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100 ">
                <span className="text-3xl text-neutral-400">🔍</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-xl text-[#0b0f1a] tracking-tight">
                  No matching classmates
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  No classmate profiles match your search criteria. Try modifying your search query or selecting other track/skill filters!
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-[var(--color-brand)]/95 transition-all shadow-[0_4px_16px_rgba(8,113,231,0.2)] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
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
          )
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

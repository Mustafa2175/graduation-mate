// components/discover/SwipeCard.tsx
"use client";

import { forwardRef, useState } from "react";
import TinderCard from "react-tinder-card";
import ProfileCard from "@/components/profile/ProfileCard";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "RIGHT" | "LEFT") => void;
  isTop: boolean;
}

const SwipeCard = forwardRef<any, SwipeCardProps>(
  ({ profile, onSwipe, isTop }, ref) => {
    const [dragDir, setDragDir] = useState<"RIGHT" | "LEFT" | null>(null);

    const handleSwipe = (dir: string) => {
      const direction = dir === "right" ? "RIGHT" : "LEFT";
      onSwipe(direction);
      setDragDir(null);
    };

  return (
    <TinderCard
      ref={ref}
      onSwipe={handleSwipe}
      onSwipeRequirementFulfilled={(dir) =>
        setDragDir(dir === 'right' ? 'RIGHT' : 'LEFT')
      }
      onSwipeRequirementUnfulfilled={() => setDragDir(null)}
      preventSwipe={['up', 'down']}
      swipeRequirementType="position"
      swipeThreshold={80}
    >
      <div className="relative select-none cursor-grab active:cursor-grabbing">
        {/* YES / SKIP labels */}
        {isTop && dragDir === 'RIGHT' && (
          <div className="absolute top-4 left-4 z-20 bg-[var(--color-brand)] text-white shadow-lg rounded-full px-4 py-1.5 pointer-events-none animate-in zoom-in duration-200">
            <span className="font-bold text-xs tracking-widest uppercase">Team Fit</span>
          </div>
        )}
        {isTop && dragDir === 'LEFT' && (
          <div className="absolute top-4 right-4 z-20 bg-neutral-800 text-white shadow-lg rounded-full px-4 py-1.5 pointer-events-none animate-in zoom-in duration-200">
            <span className="font-bold text-xs tracking-widest uppercase">Pass</span>
          </div>
        )}

          <ProfileCard profile={profile} />
        </div>
      </TinderCard>
    );
  },
);

SwipeCard.displayName = "SwipeCard";
export default SwipeCard;

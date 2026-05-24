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
        {/* SAVE TO VAULT / PASS labels */}
        {isTop && dragDir === 'RIGHT' && (
          <div className="absolute top-6 left-6 z-20 bg-digital-orange text-pure-white shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] rounded-[90px] px-6 py-2.5 pointer-events-none animate-in zoom-in duration-200 border-4 border-abyssal-ink">
            <span className="font-mono text-xs font-bold tracking-wider uppercase">SAVE TO VAULT</span>
          </div>
        )}
        {isTop && dragDir === 'LEFT' && (
          <div className="absolute top-6 right-6 z-20 bg-cyber-violet text-pure-white shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] rounded-[90px] px-6 py-2.5 pointer-events-none animate-in zoom-in duration-200 border-4 border-abyssal-ink">
            <span className="font-mono text-xs font-bold tracking-wider uppercase">PASS</span>
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

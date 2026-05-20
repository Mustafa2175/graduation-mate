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
          <div className="absolute top-4 left-4 z-20 rotate-[-15deg] border-4 border-green-500 rounded-lg px-3 py-1 pointer-events-none">
            <span className="text-green-500 font-extrabold text-xl tracking-wider">YES!</span>
          </div>
        )}
        {isTop && dragDir === 'LEFT' && (
          <div className="absolute top-4 right-4 z-20 rotate-[15deg] border-4 border-red-500 rounded-lg px-3 py-1 pointer-events-none">
            <span className="text-red-500 font-extrabold text-xl tracking-wider">SKIP</span>
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

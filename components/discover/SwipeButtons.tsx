// components/discover/SwipeButtons.tsx
import { X, Heart } from "lucide-react";

interface SwipeButtonsProps {
  onLeft: () => void;
  onRight: () => void;
  disabled?: boolean;
}

export default function SwipeButtons({
  onLeft,
  onRight,
  disabled,
}: SwipeButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Skip / Left */}
      <button
        type="button"
        onClick={onLeft}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-[#0b0f1a] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-neutral-50 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Skip"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Like / Right */}
      <button
        type="button"
        onClick={onRight}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-[#ef4d23] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(239,77,35,0.25)] hover:bg-[#ef4d23]/90 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Like"
      >
        <Heart className="w-6 h-6 fill-white stroke-none" />
      </button>
    </div>
  );
}

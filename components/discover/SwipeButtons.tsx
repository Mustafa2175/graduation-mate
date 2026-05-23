// components/discover/SwipeButtons.tsx
import { X, UserPlus } from "lucide-react";

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
        className="w-16 h-16 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 flex items-center justify-center text-[#0b0f1a] shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Skip"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Like / Right */}
      <button
        type="button"
        onClick={onRight}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white shadow-sm hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Connect"
      >
        <UserPlus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}

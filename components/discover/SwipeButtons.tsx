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
      <button
        type="button"
        onClick={onLeft}
        disabled={disabled}
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-abyssal-ink bg-ash-white text-abyssal-ink transition-all shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        aria-label="Skip"
      >
        <X className="h-6 w-6 stroke-[3.5]" />
      </button>

      <button
        type="button"
        onClick={onRight}
        disabled={disabled}
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-abyssal-ink bg-digital-orange text-pure-white transition-all shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        aria-label="Connect"
      >
        <UserPlus className="h-6 w-6 stroke-[3.5]" />
      </button>
    </div>
  );
}

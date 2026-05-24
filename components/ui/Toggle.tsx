// components/ui/Toggle.tsx
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  labelClassName?: string
  className?: string
}

export default function Toggle({ checked, onChange, label, labelClassName, className }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center shrink-0 rounded-full border-2 border-abyssal-ink transition-colors duration-200 focus:outline-none shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]',
          checked ? 'bg-digital-orange' : 'bg-pure-white',
          className
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full border-2 border-abyssal-ink transition duration-200',
            checked ? 'translate-x-5 bg-pure-white' : 'translate-x-0.5 bg-abyssal-ink'
          )}
        />
      </button>
      {label && (
        <span className={cn("text-sm font-bold text-abyssal-ink", labelClassName)}>{label}</span>
      )}
    </label>
  )
}

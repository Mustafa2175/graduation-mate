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
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
          checked ? 'bg-white' : 'bg-white/20',
          className
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5 bg-neutral-900 shadow-inner' : 'translate-x-0 bg-white shadow-md'
          )}
        />
      </button>
      {label && (
        <span className={cn("text-sm font-medium text-gray-700", labelClassName)}>{label}</span>
      )}
    </label>
  )
}


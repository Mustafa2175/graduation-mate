// components/ui/Input.tsx
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  labelClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, labelClassName, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className={cn("text-sm font-medium text-gray-700", labelClassName)}
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
            error && 'border-red-400 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input


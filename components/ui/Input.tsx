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
          <label htmlFor={id} className={cn('gm-label', labelClassName)}>
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn('gm-input', error && 'border-danger', className)}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input

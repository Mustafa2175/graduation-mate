// components/ui/Button.tsx
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base = 'gm-btn w-full disabled:cursor-not-allowed disabled:opacity-50'

  const variants = {
    primary: 'gm-btn-primary',
    secondary: 'gm-btn-secondary',
    danger:
      'border-2 border-abyssal-ink bg-pure-white text-danger hover:bg-danger hover:text-pure-white shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none transition-colors',
  }

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

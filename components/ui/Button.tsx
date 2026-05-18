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
  const base =
    'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary:
      'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900',
    secondary:
      'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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

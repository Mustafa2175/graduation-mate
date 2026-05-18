// components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export default function Badge({ children, color = 'bg-gray-100 text-gray-700', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        color,
        className
      )}
    >
      {children}
    </span>
  )
}

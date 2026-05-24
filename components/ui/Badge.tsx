// components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export default function Badge({ children, color = '', className }: BadgeProps) {
  return <span className={cn('gm-badge', color, className)}>{children}</span>
}

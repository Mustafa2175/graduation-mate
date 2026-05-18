// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Track } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const TRACK_LABELS: Record<Track, string> = {
  AI: 'AI',
  DATA_SCIENCE: 'Data Science',
  CYBERSECURITY: 'Cybersecurity',
  WEB_DEV: 'Web Dev',
  MOBILE_DEV: 'Mobile Dev',
  OTHER: 'Other',
}

export const TRACK_COLORS: Record<Track, string> = {
  AI: 'bg-purple-100 text-purple-800',
  DATA_SCIENCE: 'bg-blue-100 text-blue-800',
  CYBERSECURITY: 'bg-red-100 text-red-800',
  WEB_DEV: 'bg-orange-100 text-orange-800',
  MOBILE_DEV: 'bg-teal-100 text-teal-800',
  OTHER: 'bg-gray-100 text-gray-700',
}

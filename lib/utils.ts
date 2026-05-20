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

export function getTrackBadge(track: string | null | undefined) {
  const t = track?.toLowerCase() || '';
  if (t.includes('ai') || t.includes('intelligence') || t.includes('learning') || t.includes('vision') || t.includes('robotics')) {
    return { label: track, color: 'bg-purple-100 text-purple-800' }
  }
  if (t.includes('data')) {
    return { label: track, color: 'bg-blue-100 text-blue-800' }
  }
  if (t.includes('cyber') || t.includes('security') || t.includes('hacking') || t.includes('forensics')) {
    return { label: track, color: 'bg-red-100 text-red-800' }
  }
  if (t.includes('web') || t.includes('frontend') || t.includes('backend') || t.includes('stack') || t.includes('cloud') || t.includes('devops')) {
    return { label: track, color: 'bg-orange-100 text-orange-800' }
  }
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) {
    return { label: track, color: 'bg-teal-100 text-teal-800' }
  }
  return { label: track || 'Other', color: 'bg-gray-100 text-gray-700' }
}

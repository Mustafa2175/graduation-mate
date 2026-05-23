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

export const AVATAR_BG_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

export function getAvatarBg(name: string | null | undefined): string {
  const fallback = AVATAR_BG_COLORS[0];
  if (!name) return fallback;
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_BG_COLORS[code % AVATAR_BG_COLORS.length];
}

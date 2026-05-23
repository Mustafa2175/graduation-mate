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
    return { label: track, color: 'bg-dark-carbon text-absolute-zero border border-slate/30' }
  }
  if (t.includes('data')) {
    return { label: track, color: 'bg-deep-space text-polar-white border border-slate/30' }
  }
  if (t.includes('cyber') || t.includes('security') || t.includes('hacking') || t.includes('forensics')) {
    return { label: track, color: 'bg-midnight-void text-ash-gray border border-slate/30' }
  }
  if (t.includes('web') || t.includes('frontend') || t.includes('backend') || t.includes('stack') || t.includes('cloud') || t.includes('devops')) {
    return { label: track, color: 'bg-dark-carbon text-polar-white border border-slate/30' }
  }
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) {
    return { label: track, color: 'bg-deep-space text-ash-gray border border-slate/30' }
  }
  return { label: track || 'Other', color: 'bg-midnight-void text-polar-white border border-slate/30' }
}

const avatarColors = [
  "bg-dark-carbon text-absolute-zero",
  "bg-slate text-midnight-void",
  "bg-midnight-void text-polar-white border border-dark-carbon",
  "bg-deep-space text-ash-gray border border-dark-carbon",
];

export function getAvatarBg(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

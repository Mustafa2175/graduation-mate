// components/profile/SkillBadge.tsx

interface SkillBadgeProps {
  skill: string
}

export default function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200/30">
      {skill}
    </span>
  )
}

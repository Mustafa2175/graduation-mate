// components/profile/SkillBadge.tsx

interface SkillBadgeProps {
  skill: string
}

export default function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-[90px] border-2 border-abyssal-ink bg-pure-white px-3 py-1 font-mono text-[11px] font-bold text-abyssal-ink shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]">
      {skill}
    </span>
  )
}

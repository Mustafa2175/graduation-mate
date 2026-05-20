// components/profile/ProfileCard.tsx
"use client";

import { useState } from "react";
import { Briefcase, MessageCircle } from "lucide-react";
import type { Profile } from "@/types";
import { getInitials, getTrackBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";
import SkillBadge from "./SkillBadge";
import TeammateAvatars from "./TeammateAvatars";
import Badge from "@/components/ui/Badge";

// Deterministic background color from name
const AVATAR_BG = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];
function getAvatarBg(name: string) {
  if (!name) return AVATAR_BG[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_BG[code % AVATAR_BG.length];
}

const COMMITMENT_LABELS: Record<string, string> = {
  LOW: "Low commitment",
  MEDIUM: "Medium commitment",
  HIGH: "High commitment",
};

const COMMITMENT_COLORS: Record<string, string> = {
  LOW: "bg-yellow-100 text-yellow-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-green-100 text-green-700",
};

interface ProfileCardProps {
  profile: Profile;
  showActions?: boolean;
}

export default function ProfileCard({
  profile,
  showActions = false,
}: ProfileCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  const fullName = profile.full_name || "Anonymous";
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const trackInfo = getTrackBadge(profile.track);
  const commitmentLevel =
    profile.commitment_level in COMMITMENT_LABELS
      ? profile.commitment_level
      : "MEDIUM";
  const visibleSkills = skills.slice(0, 6);
  const extraSkills = skills.length - 6;

  const teamStatusPill = () => {
    switch (profile.team_status) {
      case "LOOKING":
        return (
          <Badge color="bg-green-100 text-green-700">Looking for team</Badge>
        );
      case "COMPLETE":
        return <Badge color="bg-gray-100 text-gray-500">Team complete</Badge>;
      case "LOOKING_FOR_MORE":
        return (
          <Badge color="bg-blue-100 text-blue-700">
            Looking for: {profile.looking_for_role || "a teammate"}
          </Badge>
        );
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 space-y-4 overflow-hidden transition-all h-full flex flex-col justify-between',
        !profile.is_available && 'opacity-60'
      )}
    >
      {/* Unavailable overlay */}
      {!profile.is_available && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl z-10 pointer-events-none" />
      )}

      {/* Top row: avatar + name + department + GPA */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-neutral-100 shadow-sm"
            />
          ) : (
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg ring-2 ring-neutral-100 shadow-sm",
                getAvatarBg(fullName),
              )}
            >
              {getInitials(fullName)}
            </div>
          )}
        </div>

        {/* Name block */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-900 text-lg truncate leading-snug">
              {fullName}
            </h3>
            {/* Availability dot */}
            <span
              className={cn(
                "inline-block w-2 h-2 rounded-full shrink-0",
                profile.is_available ? "bg-emerald-500" : "bg-neutral-300",
              )}
              title={profile.is_available ? "Available" : "Not available"}
            />
          </div>
          {profile.department && (
            <p className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider truncate mt-0.5">
              {profile.department}
            </p>
          )}
          {profile.gpa != null && (
            <p className="text-xs font-medium text-neutral-400 mt-0.5">
              GPA {profile.gpa.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Track + Commitment badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge color={trackInfo.color}>{trackInfo.label}</Badge>
        <Badge color={COMMITMENT_COLORS[commitmentLevel]}>
          {COMMITMENT_LABELS[commitmentLevel]}
        </Badge>
      </div>

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
          {extraSkills > 0 && (
            <span className="text-[12px] text-gray-400 self-center">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div>
          <p
            className={cn(
              "text-sm text-gray-600 leading-relaxed",
              !bioExpanded && "line-clamp-3",
            )}
          >
            {profile.bio}
          </p>
          {profile.bio.length > 120 && (
            <button
              type="button"
              onClick={() => setBioExpanded(!bioExpanded)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-0.5 transition-colors"
            >
              {bioExpanded ? "show less" : "read more"}
            </button>
          )}
        </div>
      )}

      {/* Team status */}
      <div>{teamStatusPill()}</div>

      {/* Bottom row: teammate avatars + action buttons */}
      <div className="flex items-center justify-between pt-1">
        <TeammateAvatars teamId={profile.team_id} />

        {showActions && (
          <div className="flex gap-2 ml-auto">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0b0f1a] px-4 py-2 text-xs font-medium text-white hover:bg-[#0b0f1a]/90 transition-all shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
            {profile.whatsapp_number && (
              <a
                href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90 transition-all shadow-[var(--shadow-float)]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

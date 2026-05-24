// components/profile/ProfileCard.tsx
"use client";

import { useState } from "react";
import { Briefcase, MessageCircle } from "lucide-react";
import type { Profile } from "@/types";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import SkillBadge from "./SkillBadge";
import TeammateAvatars from "./TeammateAvatars";
import Badge from "@/components/ui/Badge";

const COMMITMENT_LABELS: Record<string, string> = {
  LOW: "Low commitment",
  MEDIUM: "Medium commitment",
  HIGH: "High commitment",
};

const COMMITMENT_COLORS: Record<string, string> = {
  LOW: "border-rule text-muted",
  MEDIUM: "border-accent/50 text-accent",
  HIGH: "border-success/50 text-success",
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
        return <Badge color="border-emerald-200 text-emerald-700 bg-emerald-50 rounded-[90px]">Concept: Available to Draft</Badge>;
      case "COMPLETE":
        return <Badge color="border-rule text-silver-pine bg-slate-50 rounded-[90px]">Concept Locked</Badge>;
      case "LOOKING_FOR_MORE":
        return (
          <Badge color="border-electric-blue/30 text-electric-blue bg-blue-50 rounded-[90px]">
            Needs Workspace: {profile.looking_for_role || "a collaborator"}
          </Badge>
        );
    }
  };

  const COMMITMENT_LABELS_SAAS: Record<string, string> = {
    LOW: "Speed campaign",
    MEDIUM: "Balanced layout",
    HIGH: "Pillar content",
  };

  const COMMITMENT_COLORS_SAAS: Record<string, string> = {
    LOW: "border-rule text-silver-pine bg-slate-50 rounded-[90px]",
    MEDIUM: "border-electric-blue/30 text-electric-blue bg-blue-50 rounded-[90px]",
    HIGH: "border-emerald-200 text-emerald-700 bg-emerald-50 rounded-[90px]",
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-between space-y-6 overflow-hidden p-8 bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] transition-all duration-150",
        !profile.is_available && "opacity-60",
      )}
    >
      {!profile.is_available && (
        <div className="absolute inset-0 z-10 rounded-[40px] bg-basalt-canvas/60 backdrop-blur-[1px] pointer-events-none" />
      )}

      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="h-16 w-16 rounded-[16px] border-4 border-abyssal-ink object-cover shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] bg-pure-white"
            />
          ) : (
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-[16px] border-4 border-abyssal-ink text-2xl font-bold text-pure-white shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] font-display uppercase tracking-wider",
                getAvatarBg(fullName),
              )}
            >
              {getInitials(fullName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-3xl font-display tracking-wider uppercase leading-none text-abyssal-ink">
              {fullName}
            </h3>
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-abyssal-ink",
                profile.is_available ? "bg-digital-orange animate-pulse" : "bg-basalt-canvas",
              )}
              title={profile.is_available ? "Campaign Live" : "Drafting paused"}
            />
          </div>
          {profile.department && (
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-abyssal-ink font-bold">
              {profile.department}
            </p>
          )}
          {profile.gpa != null && (
            <p className="mt-1 font-mono text-xs text-abyssal-ink font-bold">
              Scale Velocity: {profile.gpa.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-pure-white rounded-[90px] font-bold">{trackInfo.label}</Badge>
        <Badge color={COMMITMENT_COLORS_SAAS[commitmentLevel]}>
          {COMMITMENT_LABELS_SAAS[commitmentLevel]}
        </Badge>
      </div>

      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {visibleSkills.map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
          {extraSkills > 0 && (
            <span className="self-center text-xs text-abyssal-ink font-bold ml-1">
              +{extraSkills} details
            </span>
          )}
        </div>
      )}

      {profile.bio && (
        <div className="pt-1">
          <p
            className={cn(
              "text-sm leading-relaxed text-abyssal-ink/80 font-semibold",
              !bioExpanded && "line-clamp-3",
            )}
          >
            {profile.bio}
          </p>
          {profile.bio.length > 120 && (
            <button
              type="button"
              onClick={() => setBioExpanded(!bioExpanded)}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-cyber-violet hover:text-digital-orange font-bold focus:outline-none cursor-pointer"
            >
              {bioExpanded ? "Show less" : "Read design strategy"}
            </button>
          )}
        </div>
      )}

      <div className="pt-2 border-t-2 border-abyssal-ink">{teamStatusPill()}</div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-abyssal-ink pt-4">
        <TeammateAvatars teamId={profile.team_id} />

        {showActions && (
          <div className="ml-auto flex gap-2">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="gm-btn gm-btn-secondary !min-h-9 !px-4 text-xs rounded-[32px] font-bold border-2 border-abyssal-ink hover:bg-basalt-canvas/40 transition-colors shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
              >
                <Briefcase className="h-3.5 w-3.5 text-abyssal-ink" />
                Website
              </a>
            )}
            {profile.whatsapp_number && (
              <a
                href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gm-btn gm-btn-primary !min-h-9 !px-4 text-xs rounded-[32px] font-bold border-2 border-abyssal-ink bg-digital-orange text-pure-white hover:bg-abyssal-ink hover:text-pure-white transition-colors shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

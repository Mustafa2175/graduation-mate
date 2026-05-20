"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTeamById, getTeamMembers } from "@/lib/queries/teams";
import { getInitials, getTrackBadge, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import SkillBadge from "@/components/profile/SkillBadge";

function getAvatarBg(name: string) {
  const colors = [
    "bg-gradient-to-tr from-pink-500 to-rose-500",
    "bg-gradient-to-tr from-purple-500 to-indigo-500",
    "bg-gradient-to-tr from-blue-500 to-cyan-500",
    "bg-gradient-to-tr from-emerald-500 to-teal-500",
    "bg-gradient-to-tr from-amber-500 to-orange-500",
    "bg-gradient-to-tr from-red-500 to-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [teammates, setTeammates] = useState<any[]>([]);

  // Decoded optional team details
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTechnologies, setProjectTechnologies] = useState("");

  useEffect(() => {
    if (!teamId) return;

    const loadTeamData = async () => {
      try {
        const teamData = await getTeamById(teamId);
        if (teamData) {
          setTeam(teamData);
          const members = await getTeamMembers(teamId);
          setTeammates(members || []);

          // Prefer the new normalized columns (migration 008); fall back to
          // JSON parsing of looking_for_role for pre-migration teams.
          const hasNewCols =
            teamData.project_description ||
            (teamData.project_technologies &&
              teamData.project_technologies.length > 0);

          if (hasNewCols) {
            setProjectDescription(teamData.project_description || "");
            setProjectTechnologies(
              (teamData.project_technologies || []).join(", "),
            );
          } else if (teamData.looking_for_role) {
            try {
              const parsed = JSON.parse(teamData.looking_for_role);
              setProjectDescription(parsed.description || "");
              setProjectTechnologies(parsed.technologies || "");
            } catch (e) {
              // Legacy plain-text fallback
              setProjectDescription("");
              setProjectTechnologies("");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching read-only team details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="space-y-2">
            <div className="w-48 h-6 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gray-100 rounded-3xl h-24" />
          <div className="bg-gray-100 rounded-3xl h-60" />
          <div className="bg-gray-100 rounded-3xl h-60" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-lg flex flex-col items-center space-y-4">
          <div className="text-5xl">🔍</div>
          <h2 className="text-xl font-black text-gray-900">Team not found</h2>
          <p className="text-sm text-gray-500">
            This team might have been disbanded or the link is invalid.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-[var(--brand)] text-white font-bold rounded-xl shadow-md hover:bg-[var(--brand-hover)] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // 1. Compute dynamic team size specs from normalized team role data.
  // Capacity falls back to a small-team default when no explicit open roles
  // are stored on the team.
  const openRolesCount = Array.isArray(team.roles_needed)
    ? team.roles_needed.length
    : 0;
  const teamSizeNeeded =
    openRolesCount > 0
      ? teammates.length + openRolesCount
      : Math.max(2, teammates.length);
  const spotsOpen = Math.max(0, teamSizeNeeded - teammates.length);

  // 2. Compute majority commitment level
  const commitmentCounts = teammates.reduce(
    (acc: Record<string, number>, m) => {
      const lvl = m.commitment_level || "MEDIUM";
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    },
    {},
  );
  let majorityCommitment = "MEDIUM";
  let maxCount = 0;
  for (const lvl in commitmentCounts) {
    if (commitmentCounts[lvl] > maxCount) {
      maxCount = commitmentCounts[lvl];
      majorityCommitment = lvl;
    }
  }

  // Badges metadata
  const trackInfo = getTrackBadge(team.looking_for_track);
  const trackColor = trackInfo.color;
  const trackLabel = trackInfo.label;

  const commitmentBadgeColor =
    majorityCommitment === "LOW"
      ? "bg-green-100 text-green-700"
      : majorityCommitment === "HIGH"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700"; // MEDIUM
  const commitmentBadgeLabel =
    majorityCommitment === "LOW"
      ? "Low commitment"
      : majorityCommitment === "HIGH"
        ? "High commitment"
        : "Medium commitment";

  // Teammates section progress specs
  const progressPercentage = Math.min(
    100,
    (teammates.length / teamSizeNeeded) * 100,
  );
  const isFull = teammates.length >= teamSizeNeeded;
  const progressColor = isFull ? "bg-green-500" : "bg-[var(--brand)]";

  // What they're building specs
  const hasTechnologies =
    !!projectTechnologies && projectTechnologies.trim().length > 0;
  const hasDescription =
    !!projectDescription && projectDescription.trim().length > 0;
  const showBuildingSection = hasTechnologies || hasDescription;

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-8 pb-14 text-left max-w-3xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
          title="Back to Matches"
        >
          <svg
            className="w-4 h-4 stroke-current fill-none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="19" x2="5" y1="12" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>

      {/* 1. Header Strip */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Track Badge */}
          <Badge color={trackColor}>{trackLabel}</Badge>

          {/* Spots Open Badge */}
          {spotsOpen > 0 ? (
            <Badge color="bg-[var(--brand-light)] text-[var(--brand)]">
              {spotsOpen} {spotsOpen === 1 ? "spot" : "spots"} open
            </Badge>
          ) : (
            <Badge color="bg-gray-100 text-gray-400">Team full</Badge>
          )}

          {/* Commitment Badge */}
          <Badge color={commitmentBadgeColor}>{commitmentBadgeLabel}</Badge>
        </div>

        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
            {team.name}
          </h1>

          {/* Dynamic subtitle */}
          {team.looking_for_role ? (
            <p className="text-sm text-gray-500 mt-2 font-semibold">
              Looking for a {team.looking_for_role}
            </p>
          ) : spotsOpen > 0 ? (
            <p className="text-sm text-gray-500 mt-2 font-semibold">
              Open to new members
            </p>
          ) : null}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* 2. Teammates Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-black text-gray-900">
            Teammates ({teammates.length} of {teamSizeNeeded})
          </h2>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progressColor,
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teammates.map((member) => {
            const memberSkills = member.skills || [];
            const visibleSkills = memberSkills.slice(0, 4);
            const extraSkills = memberSkills.length - 4;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Header: Avatar, Name, Track */}
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white",
                          getAvatarBg(member.full_name),
                        )}
                      >
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-snug">
                        {member.full_name}
                      </h4>
                      <div className="mt-0.5">
                        <Badge color={getTrackBadge(member.track).color}>
                          {getTrackBadge(member.track).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Bio (Truncated to 2 lines) */}
                  {member.bio && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Skills (Max 4, overflow N more) */}
                  {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visibleSkills.map((skill: string) => (
                        <SkillBadge key={skill} skill={skill} />
                      ))}
                      {extraSkills > 0 && (
                        <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border self-center font-bold">
                          +{extraSkills} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Contacts Row */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">
                    Contacts:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {member.whatsapp_number && (
                      <a
                        href={`https://wa.me/${member.whatsapp_number.replace(/[^0-9]/g, "")}?text=Hey%20${encodeURIComponent(member.full_name)}!%20Connecting%20from%20Graduation%20Mate!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp direct chat"
                      >
                        <svg
                          className="w-3.5 h-3.5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.035-4.326l.4.237c1.724 1.025 3.738 1.566 5.794 1.568 5.79 0 10.496-4.702 10.5-10.493.002-2.802-1.086-5.437-3.064-7.419C17.737 1.588 15.101.5 12.01.5 6.218.5 1.516 5.203 1.513 11c-.001 2.062.54 4.074 1.567 5.799l.259.439-1.031 3.766 3.784-1.03zm12.385-6.55c-.27-.136-1.602-.79-1.85-.88-.25-.09-.43-.136-.61.136-.18.27-.69.88-.85 1.056-.15.18-.3.2-.57.064-.27-.136-1.138-.419-2.169-1.338-.802-.716-1.344-1.602-1.5-1.875-.157-.273-.017-.42.119-.556.12-.12.27-.315.4-.472.13-.158.18-.27.27-.45.09-.18.04-.34-.02-.473-.06-.136-.61-1.477-.83-2.015-.22-.53-.44-.45-.61-.46-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.353-.26.284-1 .977-1 2.385s1.02 2.76 1.16 2.95c.14.19 2 3.05 4.85 4.276.68.29 1.21.467 1.63.6.69.22 1.32.19 1.81.116.55-.08 1.6-.656 1.83-1.288.225-.63.225-1.17.157-1.288-.07-.116-.25-.205-.52-.34z" />
                        </svg>
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="LinkedIn profile"
                      >
                        <svg
                          className="w-3.5 h-3.5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. What They're Building Section */}
      {showBuildingSection && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            🚀 What they're building
          </h2>

          {hasDescription && (
            <p className="text-sm text-gray-700 leading-relaxed p-4 rounded-2xl bg-gray-50 border border-gray-100">
              {projectDescription}
            </p>
          )}

          {hasTechnologies && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Preferred Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {projectTechnologies.split(",").map((tech: string) => (
                  <span
                    key={tech}
                    className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl text-xs font-bold text-gray-700 shadow-sm"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

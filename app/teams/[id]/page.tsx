"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTeamById, getTeamMembers } from "@/lib/queries/teams";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import SkillBadge from "@/components/profile/SkillBadge";


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
        // Silently catch error fetching read-only team details
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="gm-page space-y-8 bg-basalt-canvas">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ash-white border-4 border-abyssal-ink rounded-[16px] gm-skeleton shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]" />
          <div className="space-y-2.5">
            <div className="w-48 h-7 bg-ash-white border-2 border-abyssal-ink rounded-[90px] gm-skeleton" />
            <div className="w-24 h-4 bg-ash-white border-2 border-abyssal-ink rounded-[90px] gm-skeleton" />
          </div>
        </div>
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] h-28 gm-skeleton shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]" />
          <div className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] h-64 gm-skeleton shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]" />
          <div className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] h-64 gm-skeleton shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="gm-page flex flex-col justify-center items-center bg-basalt-canvas">
        <div className="w-full max-w-md bg-ash-white rounded-[40px] border-4 border-abyssal-ink p-8 text-center shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] flex flex-col items-center space-y-5 animate-reveal">
          <div className="text-5xl">🔍</div>
          <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink leading-none">Workspace not found</h2>
          <p className="text-sm leading-relaxed text-abyssal-ink font-semibold opacity-85">
            This workspace might have been disbanded or the secure token link is invalid.
          </p>
          <button
            onClick={() => router.back()}
            className="gm-btn gm-btn-primary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none cursor-pointer"
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

  const COMMITMENT_LABELS_SAAS: Record<string, string> = {
    LOW: "Speed campaign",
    MEDIUM: "Balanced layout",
    HIGH: "Pillar content",
  };

  const COMMITMENT_COLORS_SAAS: Record<string, string> = {
    LOW: "border-2 border-abyssal-ink bg-ash-white text-abyssal-ink rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]",
    MEDIUM: "border-2 border-abyssal-ink bg-pixel-glare text-abyssal-ink rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]",
    HIGH: "border-2 border-abyssal-ink bg-cyber-violet text-pure-white rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]",
  };

  // Teammates section progress specs
  const progressPercentage = Math.min(
    100,
    (teammates.length / teamSizeNeeded) * 100,
  );
  const isFull = teammates.length >= teamSizeNeeded;
  const progressColor = isFull ? "bg-digital-orange" : "bg-cyber-violet";

  // What they're building specs
  const hasTechnologies =
    !!projectTechnologies && projectTechnologies.trim().length > 0;
  const hasDescription =
    !!projectDescription && projectDescription.trim().length > 0;
  const showBuildingSection = hasTechnologies || hasDescription;

  return (
    <div className="gm-page bg-basalt-canvas space-y-8 pb-14 text-left max-w-3xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.back()}
          className="gm-btn gm-btn-secondary !min-h-10 !px-3 rounded-xl border-2 border-abyssal-ink hover:bg-basalt-canvas/40 shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center justify-center"
          title="Back to matches pipeline"
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
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Track Badge */}
          <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-pure-white rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]">
            {trackLabel}
          </Badge>

          {/* Spots Open Badge */}
          {spotsOpen > 0 ? (
            <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-pixel-glare rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]">
              {spotsOpen} {spotsOpen === 1 ? "seat" : "seats"} open
            </Badge>
          ) : (
            <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-ash-white rounded-[90px] font-bold shadow-[1px_1px_0px_0px_rgba(7,6,7,1)] opacity-70">
              Workspace locked
            </Badge>
          )}

          {/* Commitment Badge */}
          <Badge color={COMMITMENT_COLORS_SAAS[majorityCommitment]}>
            {COMMITMENT_LABELS_SAAS[majorityCommitment]}
          </Badge>
        </div>

        <div>
          <h1 className="text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">
            {team.name}
          </h1>

          {/* Dynamic subtitle */}
          {team.looking_for_role ? (
            <p className="text-sm text-abyssal-ink/80 mt-2 font-bold">
              Looking for capability: {team.looking_for_role}
            </p>
          ) : spotsOpen > 0 ? (
            <p className="text-sm text-abyssal-ink/80 mt-2 font-bold">
              Open to new collaborators
            </p>
          ) : null}
        </div>
      </div>

      <hr className="border-t-2 border-abyssal-ink" />

      {/* 2. Teammates Section */}
      <div className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink">
            Workspace Members <span className="font-mono text-xs text-abyssal-ink/65 font-bold">({teammates.length} of {teamSizeNeeded})</span>
          </h2>
          <div className="w-full h-4 bg-ash-white border-4 border-abyssal-ink rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progressColor,
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teammates.map((member) => {
            const memberSkills = member.skills || [];
            const visibleSkills = memberSkills.slice(0, 4);
            const extraSkills = memberSkills.length - 4;

            return (
              <div
                key={member.id}
                className="bg-ash-white border-4 border-abyssal-ink p-6 rounded-[40px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] transition-all duration-150"
              >
                <div className="space-y-4">
                  {/* Header: Avatar, Name, Track */}
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-12 h-12 rounded-[16px] border-4 border-abyssal-ink object-cover shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] bg-pure-white"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-12 h-12 rounded-[16px] border-4 border-abyssal-ink flex items-center justify-center text-sm font-bold text-pure-white shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] font-display uppercase tracking-wider",
                          getAvatarBg(member.full_name),
                        )}
                      >
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-display text-lg tracking-wider text-abyssal-ink uppercase leading-snug">
                        {member.full_name}
                      </h4>
                      <div className="mt-1">
                        <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-pure-white rounded-[90px] text-[10px] font-bold">
                          {getTrackBadge(member.track).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Bio (Truncated to 2 lines) */}
                  {member.bio && (
                    <p className="text-xs leading-relaxed text-abyssal-ink/80 font-semibold line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {/* Skills (Max 4, overflow N more) */}
                  {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {visibleSkills.map((skill: string) => (
                        <SkillBadge key={skill} skill={skill} />
                      ))}
                      {extraSkills > 0 && (
                        <span className="text-[10px] text-abyssal-ink font-bold self-center ml-1">
                          +{extraSkills} details
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Contacts Row */}
                <div className="mt-5 pt-4 border-t-2 border-abyssal-ink flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-abyssal-ink uppercase tracking-wide">
                    Workspace assets:
                  </span>
                  <div className="flex items-center gap-2">
                    {member.whatsapp_number && (
                      <a
                        href={`https://wa.me/${member.whatsapp_number.replace(/[^0-9]/g, "")}?text=Hey%20${encodeURIComponent(member.full_name)}!%20Connecting%20from%20GenieStudio!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border-2 border-abyssal-ink bg-digital-orange text-pure-white hover:bg-abyssal-ink hover:text-pure-white transition-colors shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
                        title="WhatsApp direct chat"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
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
                        className="p-2 rounded-xl border-2 border-abyssal-ink bg-cyber-violet text-pure-white hover:bg-abyssal-ink hover:text-pure-white transition-colors shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
                        title="LinkedIn profile"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
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
        <div className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] space-y-5 mt-8">
          <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink flex items-center gap-2 border-b-2 border-abyssal-ink pb-2">
            🚀 Campaign Concept Details
          </h2>

          {hasDescription && (
            <p className="text-sm text-abyssal-ink font-semibold leading-relaxed p-5 rounded-[20px] bg-basalt-canvas border-2 border-abyssal-ink">
              {projectDescription}
            </p>
          )}

          {hasTechnologies && (
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] font-bold text-abyssal-ink uppercase tracking-widest">
                Preferred Style Engines
              </h4>
              <div className="flex flex-wrap gap-2">
                {projectTechnologies.split(",").map((tech: string) => (
                  <span
                    key={tech}
                    className="bg-pixel-glare border-2 border-abyssal-ink px-3 py-1 rounded-[90px] text-xs font-bold text-abyssal-ink shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]"
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

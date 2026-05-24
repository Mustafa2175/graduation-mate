"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getProfileById } from "@/lib/queries/profiles";
import { getTeamById, getTeamMembers, leaveTeam, updateTeamDetails } from "@/lib/queries/teams";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import { Compass, ClipboardCheck, Copy, Check, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SkillBadge from "@/components/profile/SkillBadge";

export default function MyTeamPage() {
  const router = useRouter();
  const { getFreshUser } = useAuth();
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [teammates, setTeammates] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTechnologies, setProjectTechnologies] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const loadTeamData = async (profileId: string) => {
    try {
      const { data: profile } = await getProfileById(profileId);
      if (profile && profile.team_id) {
        const teamData = await getTeamById(profile.team_id);
        const members = await getTeamMembers(profile.team_id);
        setTeam(teamData);
        setTeammates(members || []);
        setTeamName(teamData?.name || "");

        const hasNewCols =
          teamData.project_description ||
          (teamData.project_technologies && teamData.project_technologies.length > 0) ||
          (teamData.roles_needed && teamData.roles_needed.length > 0);

        if (hasNewCols) {
          setProjectDescription(teamData.project_description || "");
          setProjectTechnologies((teamData.project_technologies || []).join(", "));
          setRolesNeeded((teamData.roles_needed || []).join(", "));
        } else if (teamData?.looking_for_role) {
          try {
            const parsed = JSON.parse(teamData.looking_for_role);
            setProjectDescription(parsed.description || "");
            setProjectTechnologies(parsed.technologies || "");
            setRolesNeeded(parsed.rolesNeeded || "");
          } catch {
            setRolesNeeded(teamData.looking_for_role);
            setProjectDescription("");
            setProjectTechnologies("");
          }
        } else {
          setProjectDescription("");
          setProjectTechnologies("");
          setRolesNeeded("");
        }
      } else {
        setTeam(null);
        setTeammates([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hydrateUser = async () => {
      const user = await getFreshUser();
      if (!user) {
        setIsLoading(false);
        router.replace("/login");
        return;
      }
      setCurrentUserId(user.profileId);
      loadTeamData(user.profileId);
    };
    hydrateUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = () => {
    if (!team?.id) return;
    navigator.clipboard.writeText(team.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTeamDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!team?.id) return;
    setIsSavingDetails(true);
    setSaveSuccess(false);

    try {
      const techArray = projectTechnologies.split(",").map((t) => t.trim()).filter(Boolean);
      const rolesArray = rolesNeeded.split(",").map((r) => r.trim()).filter(Boolean);
      const { error } = await updateTeamDetails(team.id, {
        name: teamName,
        project_description: projectDescription || null,
        project_technologies: techArray.length > 0 ? techArray : null,
        roles_needed: rolesArray.length > 0 ? rolesArray : null,
      });
      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setTeam(await getTeamById(team.id));
      }
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team?.id || !currentUserId) return;
    try {
      setIsLoading(true);
      await leaveTeam(team.id, currentUserId);
      setConfirmLeave(false);
      await loadTeamData(currentUserId);
    } catch {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="gm-page space-y-6">
        <div className="gm-skeleton h-12 w-64" />
        <div className="gm-skeleton h-60 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="gm-skeleton h-80" />
          <div className="gm-skeleton h-80" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="gm-page flex items-center justify-center bg-basalt-canvas">
        <div className="flex w-full max-w-lg flex-col items-center space-y-6 p-8 text-center bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] animate-reveal">
          <div>
            <p className="gm-kicker">Workspace Mode</p>
            <h1 className="mt-2 text-4xl font-display uppercase tracking-wider text-abyssal-ink leading-none">No active workspace</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-abyssal-ink font-semibold opacity-85">
              Discover trend options, save drafts to your vault, and configure custom team workspaces from your dashboard.
            </p>
          </div>
          <div className="w-full space-y-4">
            <Link href="/discover" className="block w-full">
              <Button className="gm-btn gm-btn-primary w-full gap-2 rounded-[32px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
                <Compass className="h-4 w-4 stroke-[3]" /> Discover Trends
              </Button>
            </Link>
            <Link href="/profile/edit" className="block w-full">
              <Button variant="secondary" className="gm-btn gm-btn-secondary w-full rounded-[32px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
                Brand Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gm-page space-y-8 bg-basalt-canvas">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="border-2 border-abyssal-ink text-pure-white bg-cyber-violet rounded-[90px] font-bold">GenieStudio Workspace</Badge>
            <span className="font-mono text-xs text-abyssal-ink font-bold">
              Initialized {new Date(team.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="mt-2 text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">{team.name}</h1>
        </div>

        <div className="flex items-center justify-between gap-6 p-4 bg-ash-white border-4 border-abyssal-ink rounded-[24px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-abyssal-ink font-bold">Workspace Access Token</p>
            <p className="max-w-[12rem] truncate font-mono text-xs font-bold text-abyssal-ink">{team.id}</p>
          </div>
          <button onClick={handleCopyCode} className="gm-btn gm-btn-secondary !min-h-10 !px-3 rounded-xl border-2 border-abyssal-ink hover:bg-basalt-canvas/40 cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none" title="Copy invitation code">
            {copied ? <ClipboardCheck className="h-4 w-4 text-emerald-600 stroke-[3]" /> : <Copy className="h-4 w-4 text-abyssal-ink stroke-[2.5]" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink">Workspace Members <span className="font-mono text-xs text-abyssal-ink/65 font-bold">({teammates.length})</span></h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {teammates.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              return (
                <article key={member.id} className={cn("relative space-y-4 p-6 bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] transition-all duration-150", isCurrentUser && "border-digital-orange")}>
                  {isCurrentUser && <span className="absolute right-6 top-6 font-mono text-[10px] uppercase text-digital-orange font-bold bg-pixel-glare px-3 py-1 rounded-[90px] border-2 border-abyssal-ink shadow-[1px_1px_0px_0px_rgba(7,6,7,1)] animate-reveal">You</span>}
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="h-12 w-12 rounded-[16px] border-4 border-abyssal-ink object-cover shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]" />
                    ) : (
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-[16px] border-4 border-abyssal-ink text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] font-display", getAvatarBg(member.full_name))}>
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-bold text-abyssal-ink font-display">{member.full_name}</h4>
                      <Badge color="border-2 border-abyssal-ink text-abyssal-ink bg-basalt-canvas rounded-[90px] text-[10px] font-bold mt-1">{getTrackBadge(member.track).label}</Badge>
                    </div>
                  </div>
                  {member.bio && <p className="line-clamp-2 text-xs leading-relaxed text-abyssal-ink/80 font-semibold">{member.bio}</p>}
                  {member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {member.skills.slice(0, 4).map((skill: string) => <SkillBadge key={skill} skill={skill} />)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="p-6 bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
            <h2 className="mb-4 text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">Workspace Config</h2>
            <form onSubmit={handleSaveTeamDetails} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-abyssal-ink font-bold text-[10px] tracking-wider uppercase">Brand Campaign Title</span>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required className="gm-input bg-pure-white border-abyssal-ink text-abyssal-ink" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-abyssal-ink font-bold text-[10px] tracking-wider uppercase">Campaign Abstract & Goals</span>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={4} className="gm-input bg-pure-white border-abyssal-ink text-abyssal-ink min-h-28 resize-none rounded-[20px]" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-abyssal-ink font-bold text-[10px] tracking-wider uppercase">Preferred Style Engines</span>
                <input value={projectTechnologies} onChange={(e) => setProjectTechnologies(e.target.value)} className="gm-input bg-pure-white border-abyssal-ink text-abyssal-ink" placeholder="e.g. Clean Minimalist, Vibrant Pastel" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-abyssal-ink font-bold text-[10px] tracking-wider uppercase">Target Capabilities</span>
                <input value={rolesNeeded} onChange={(e) => setRolesNeeded(e.target.value)} className="gm-input bg-pure-white border-abyssal-ink text-abyssal-ink" placeholder="e.g. UI/UX Designer, Copywriter" />
              </label>
              <Button type="submit" disabled={isSavingDetails} className="gm-btn gm-btn-primary w-full rounded-[32px] cursor-pointer mt-2 shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
                {isSavingDetails ? "Saving..." : saveSuccess ? <span className="flex items-center justify-center gap-2"><Check className="h-4 w-4 stroke-[3]" /> Saved</span> : "Save configurations"}
              </Button>
            </form>
          </section>

          <section className="rounded-[40px] border-4 border-abyssal-ink bg-pixel-glare p-6 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
            <h3 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink">Danger Zone</h3>
            <p className="mt-2 text-xs leading-relaxed text-abyssal-ink font-semibold">Leaving removes you from this group. If you are the last member, the workspace will be deactivated.</p>
            {confirmLeave ? (
              <div className="mt-4 space-y-2">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-digital-orange"><AlertCircle className="h-4 w-4 animate-pulse stroke-[3]" /> Confirm leave</p>
                <div className="flex gap-2">
                  <button onClick={handleLeaveTeam} className="gm-btn flex-1 bg-digital-orange border-2 border-abyssal-ink text-pure-white rounded-[32px] text-xs font-bold py-2.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">Leave</button>
                  <button onClick={() => setConfirmLeave(false)} className="gm-btn gm-btn-secondary flex-1 rounded-[32px] text-xs font-bold border-2 border-abyssal-ink cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmLeave(true)} className="gm-btn mt-4 w-full border-2 border-abyssal-ink bg-pure-white text-abyssal-ink rounded-[32px] text-xs font-bold py-2.5 hover:bg-basalt-canvas/40 cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">Leave workspace</button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

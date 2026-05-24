"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getProfileById,
  updateProfile,
  upsertProfileContacts,
} from "@/lib/queries/profiles";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamMembers,
  getTeamById,
} from "@/lib/queries/teams";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { getInitials } from "@/lib/utils";

const TRACK_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Deep Learning",
  "Generative AI",
  "Natural Language Processing",
  "Computer Vision",
  "Robotics",
  "Data Science",
  "Data Analysis",
  "Data Engineering",
  "Big Data Engineering",
  "Business Intelligence",
  "Software Engineering",
  "Backend Development",
  "Frontend Development",
  "Full Stack Development",
  "Mobile App Development",
  "Android Development",
  "iOS Development",
  "Game Development",
  "Web Development",
  "Cloud Computing",
  "DevOps",
  "Site Reliability Engineering",
  "Cybersecurity",
  "Ethical Hacking",
  "Digital Forensics",
  "Network Security",
  "Blockchain Development",
  "Embedded Systems",
  "Internet of Things (IoT)",
  "Operating Systems",
  "Database Administration",
  "Database Engineering",
  "Distributed Systems",
  "Computer Networks",
  "System Programming",
  "Compiler Design",
  "Quantum Computing",
  "Bioinformatics",
  "Human-Computer Interaction",
  "UI/UX Design",
  "AR/VR Development",
  "Product Management",
  "Technical Project Management",
  "IT Support",
  "IT Administration",
  "Automation Engineering",
  "MLOps",
  "AIOps",
];

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  department: z.string().optional(),
  gpa: z.coerce.number().min(0).max(4).optional().or(z.literal("")),
  track: z.string().min(1, "Track is required"),
  bio: z.string().max(300).optional(),
  linkedin_url: z.union([
    z.string().url("Must be a valid URL"),
    z.literal(""),
  ]),
  whatsapp_number: z
    .string()
    .regex(
      /^\+?\d{7,15}$/,
      "Enter a valid international number (e.g. +201234567890)",
    ),
  team_status: z.enum(["LOOKING", "COMPLETE", "LOOKING_FOR_MORE"]),
  looking_for_role: z.string().optional(),
});

const SUGGESTED_SKILLS = [
  "React",
  "Next.js",
  "Python",
  "Machine Learning",
  "Data Analysis",
  "Figma",
  "UI/UX",
  "Node.js",
  "PostgreSQL",
  "Flutter",
  "Java",
  "C++",
  "Cybersecurity",
  "AWS",
  "Docker",
  "Swift",
];

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const { getFreshUser, setCurrentUser, clearCurrentUser } = useAuth();

  const [isAvailable, setIsAvailable] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [trackSearchTerm, setTrackSearchTerm] = useState("");
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);

  const filteredTrackOptions = TRACK_OPTIONS.filter((option) =>
    option.toLowerCase().includes(trackSearchTerm.toLowerCase()),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Team state
  const [team, setTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [joinIdInput, setJoinIdInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  const teamStatus = watch("team_status");
  const bio = watch("bio") ?? "";

  const loadData = async () => {
    const user = await getFreshUser();
    if (!user) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }
    setProfileId(user.profileId);

    const { data, error } = await getProfileById(user.profileId);
    if (error || !data) {
      // Silently catch profile load error
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    reset({
      full_name: data.full_name,
      department: data.department ?? "",
      gpa: data.gpa ?? "",
      track: data.track,
      bio: data.bio ?? "",
      linkedin_url: data.linkedin_url ?? "",
      whatsapp_number: data.whatsapp_number ?? "",
      team_status: data.team_status,
      looking_for_role: data.looking_for_role ?? "",
    });
    setSkills(data.skills ?? []);
    setIsAvailable(data.is_available);
    setAvatarPreview(data.avatar_url);
    setTrackSearchTerm(data.track || "");

    if (data.team_id) {
      const t = await getTeamById(data.team_id);
      const m = await getTeamMembers(data.team_id);
      setTeam(t);
      setTeamMembers(m);
    } else {
      setTeam(null);
      setTeamMembers([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    register("track");
  }, [register]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput("");
  };
  const removeSkill = (skill: string) =>
    setSkills(skills.filter((s) => s !== skill));

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await clearCurrentUser();
      if (error) {
        // Silently catch logout error
        toast.error(
          "Signed out locally, but Supabase sign-out reported an error. Redirecting...",
        );
      }
    } catch (error) {
      // Silently catch unexpected logout error
      toast.error("Logout hit an unexpected error. Redirecting...");
    } finally {
      // Full document navigation is more reliable than client routing here: it
      // forces the proxy layer to evaluate the updated Supabase cookies after
      // sign-out and prevents stale client state from keeping protected UI alive.
      window.location.assign("/login");
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!profileId) return;
    try {
      let finalAvatarUrl = avatarPreview;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${profileId}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError)
          throw new Error("Failed to upload avatar: " + uploadError.message);
        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        finalAvatarUrl = publicUrl.publicUrl;
      }

      const profilePayload: Parameters<typeof updateProfile>[1] = {
        full_name: data.full_name,
        department: data.department || null,
        gpa: data.gpa ? Number(data.gpa) : null,
        track: data.track,
        skills,
        commitment_level: "MEDIUM",
        bio: data.bio || null,
        is_available: isAvailable,
        team_status: data.team_status,
        looking_for_role: data.looking_for_role || null,
      };
      if (finalAvatarUrl !== avatarPreview) {
        profilePayload.avatar_url = finalAvatarUrl;
      }

      const { data: profile, error } = await updateProfile(
        profileId,
        profilePayload,
      );

      if (error || !profile)
        throw new Error(error?.message || "Failed to update profile");

      const { error: contactsError } = await upsertProfileContacts(profileId, {
        linkedin_url: data.linkedin_url || null,
        whatsapp_number: data.whatsapp_number || null,
      });
      if (contactsError)
        throw new Error(contactsError.message || "Failed to update contacts");

      setCurrentUser(profile.id, profile.full_name);
      toast.success("Profile updated!");
      router.replace("/discover");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Team actions
  const handleCreateTeam = async () => {
    if (!teamNameInput.trim()) return;
    try {
      await createTeam(teamNameInput, profileId!);
      setTeamNameInput("");
      toast.success("Team created!");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinIdInput.trim()) return;
    try {
      await joinTeam(joinIdInput, profileId!);
      setJoinIdInput("");
      toast.success("Joined team!");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    try {
      await leaveTeam(team.id, profileId!);
      toast.success("Left team");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(profileId!);
    toast.success("Your Profile ID copied!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-body pb-28 bg-basalt-canvas text-abyssal-ink">
      {/* Soft decorative background shapes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(82,74,233,0.05),transparent_25rem)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(252,80,0,0.05),transparent_25rem)] z-0 pointer-events-none" />

      {/* Brand Vault Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-20 pb-10 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 gap-6">
        <div className="space-y-3 text-center sm:text-left gm-reveal">
          <p className="gm-kicker">Brand Vault Dashboard</p>
          <h1 className="text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">
            Configure your Brand Vault.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-abyssal-ink font-semibold opacity-85">
            Manage your campaign visual presets, target format focus, active style tags, and team workspace configurations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="gm-btn border-4 border-abyssal-ink bg-ash-white text-red-600 hover:bg-basalt-canvas/40 rounded-[32px] px-6 py-2.5 text-xs font-bold cursor-pointer shrink-0 shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      <div className="w-full mx-auto space-y-8 relative z-10 px-4 sm:px-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10 animate-fade-rise-delay-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-6 flex justify-center shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
              <AvatarUpload
                currentUrl={avatarPreview}
                onSelect={handleAvatarSelect}
              />
            </section>

            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">
                Creator & Company Info
              </h2>
              <Input
                id="full_name"
                label="Creator Name *"
                placeholder="e.g. Ahmed Ali"
                labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                {...register("full_name")}
                error={errors.full_name?.message}
              />
              <Input
                id="department"
                label="Primary Creator Domain"
                placeholder="e.g. Software Engineering"
                labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                {...register("department")}
                error={errors.department?.message}
              />
              <Input
                id="gpa"
                label="Content Capacity Scale (1–4)"
                type="number"
                step="0.01"
                placeholder="e.g. 4.00"
                labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                {...register("gpa")}
                error={errors.gpa?.message}
              />
            </section>

            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">
                Target Format Focus
              </h2>

              <div className="relative flex flex-col gap-1.5 w-full">
                <label
                  htmlFor="track-search"
                  className="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                >
                  Format Focus *
                </label>
                <div className="relative">
                  <input
                    id="track-search"
                    type="text"
                    value={trackSearchTerm}
                    onChange={(e) => {
                      setTrackSearchTerm(e.target.value);
                      setValue("track", e.target.value, {
                        shouldValidate: true,
                      });
                      setIsTrackDropdownOpen(true);
                    }}
                    onFocus={() => setIsTrackDropdownOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setIsTrackDropdownOpen(false), 200);
                    }}
                    placeholder="Search format focus (e.g. Generative AI, Web Development)"
                    className="w-full rounded-xl border border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 focus:outline-none focus:ring-1 focus:ring-cyber-violet focus:bg-white transition-all font-semibold"
                    autoComplete="off"
                  />

                  {isTrackDropdownOpen && filteredTrackOptions.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-abyssal-ink bg-pure-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {filteredTrackOptions.map((option) => (
                        <li
                          key={option}
                          onMouseDown={() => {
                            setTrackSearchTerm(option);
                            setValue("track", option, { shouldValidate: true });
                            setIsTrackDropdownOpen(false);
                          }}
                          className="relative cursor-pointer select-none px-4 py-2.5 transition-colors text-abyssal-ink font-semibold hover:bg-basalt-canvas/40"
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.track && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.track.message}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">
                Creator Style & Tags
              </h2>
              <div className="flex gap-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add custom style tag + Enter"
                  className="flex-1 rounded-xl border-2 border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 focus:outline-none focus:ring-1 focus:ring-cyber-violet focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="rounded-xl border-2 border-abyssal-ink bg-digital-orange text-pure-white px-5 text-sm font-bold hover:bg-abyssal-ink transition-colors focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
                >
                  Add
                </button>
              </div>

              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).length >
                0 && (
                <div className="pt-2 border-t-2 border-abyssal-ink">
                  <p className="text-[10px] text-abyssal-ink mb-2.5 uppercase tracking-wider font-bold">
                    Suggested
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 12)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setSkills([...skills, skill])}
                          className="inline-flex items-center rounded-[90px] border border-rule bg-pure-white px-3 py-1.5 text-[11px] font-bold text-abyssal-ink hover:bg-basalt-canvas/40 hover:text-digital-orange transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-4 border-t-2 border-abyssal-ink">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-[90px] bg-pure-white border-2 border-abyssal-ink px-4 py-1.5 text-xs font-bold text-abyssal-ink shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]"
                    >
                      {skill}{" "}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-abyssal-ink/60 hover:text-digital-orange ml-1 cursor-pointer focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">
                Brand Definition
              </h2>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bio"
                  className="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                >
                  Brand Voice Description
                </label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  rows={3}
                  maxLength={300}
                  placeholder="Describe your brand voice, content focus, and key messaging..."
                  className="w-full rounded-xl border border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-violet focus:bg-white transition-all font-semibold"
                />
                <p className="text-[10px] text-abyssal-ink font-bold text-right mt-1">
                  {bio.length}/300
                </p>
              </div>
              <Input
                id="linkedin_url"
                label="Brand Website / LinkedIn URL *"
                type="url"
                placeholder="https://geniestudio.app/..."
                labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                {...register("linkedin_url")}
                error={errors.linkedin_url?.message}
              />
              <Input
                id="whatsapp_number"
                label="Workspace Support WhatsApp *"
                placeholder="+201234567890"
                labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                {...register("whatsapp_number")}
                error={errors.whatsapp_number?.message}
              />
            </section>

            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-2">
                Collaboration Preferences
              </h2>
              <Toggle
                checked={isAvailable}
                onChange={setIsAvailable}
                label="Open to collaborations / guest workspace invites"
                labelClassName="text-abyssal-ink font-bold"
              />
              <div className="flex flex-col gap-1.5 pt-2">
                <label
                  htmlFor="team_status"
                  className="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                >
                  Collaboration Mode *
                </label>
                <select
                  id="team_status"
                  {...register("team_status")}
                  className="w-full rounded-xl border-2 border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink focus:outline-none focus:ring-1 focus:ring-cyber-violet focus:bg-white transition-all cursor-pointer font-semibold"
                >
                  <option className="text-neutral-900" value="LOOKING">
                    Concept: Available to Draft
                  </option>
                  <option className="text-neutral-900" value="COMPLETE">
                    Draft Lock
                  </option>
                  <option className="text-neutral-900" value="LOOKING_FOR_MORE">
                    Needs Workspace Collaborator
                  </option>
                </select>
              </div>
              {teamStatus === "LOOKING_FOR_MORE" && (
                <Input
                  id="looking_for_role"
                  label="Looking for role"
                  placeholder="e.g. Frontend Developer"
                  labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
                  className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                  {...register("looking_for_role")}
                  error={errors.looking_for_role?.message}
                />
              )}
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden rounded-[800px] py-4 text-base font-bold tracking-wide text-pure-white bg-digital-orange border-4 border-abyssal-ink hover:bg-abyssal-ink active:translate-y-[1px] transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:shadow-none mt-4 flex items-center justify-center"
            >
              {isSubmitting ? "Saving Changes..." : "Save Brand Settings"}
            </button>
          </form>

          <div className="space-y-8">
            {/* TEAM SYSTEM SECTION */}
            <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
              <div className="flex items-center justify-between border-b-2 border-abyssal-ink pb-3">
                <h2 className="text-2xl font-display uppercase tracking-wider text-abyssal-ink">
                  Brand Workspace
                </h2>
                <button
                  onClick={copyId}
                  className="text-xs text-abyssal-ink hover:text-digital-orange font-bold uppercase tracking-wider transition-colors cursor-pointer bg-pure-white border-2 border-abyssal-ink px-4 py-1.5 rounded-[32px] shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
                >
                  Copy Access Token
                </button>
              </div>

              {!team ? (
                <div className="space-y-6 pt-2 font-semibold">
                  {/* Create Team */}
                  <div className="space-y-3">
                    <label className="text-abyssal-ink font-bold text-xs tracking-wider uppercase">
                      Create a Workspace
                    </label>
                    <Input
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="Enter Workspace Title"
                      className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTeam}
                      className="w-full relative overflow-hidden rounded-[800px] py-3 text-sm font-bold tracking-wide text-pure-white bg-digital-orange border-4 border-abyssal-ink hover:bg-abyssal-ink transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
                    >
                      Create workspace
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-[2px] bg-abyssal-ink flex-1" />
                    <span className="text-[10px] text-abyssal-ink font-bold uppercase tracking-wider">
                      OR
                    </span>
                    <div className="h-[2px] bg-abyssal-ink flex-1" />
                  </div>

                  {/* Join Team */}
                  <div className="space-y-3">
                    <label className="text-abyssal-ink font-bold text-xs tracking-wider uppercase">
                      Join Existing Workspace
                    </label>
                    <Input
                      value={joinIdInput}
                      onChange={(e) => setJoinIdInput(e.target.value)}
                      placeholder="Workspace Access Token"
                      className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleJoinTeam}
                      className="w-full relative overflow-hidden rounded-[800px] py-3 text-sm font-bold tracking-wide text-pure-white bg-digital-orange border-4 border-abyssal-ink hover:bg-abyssal-ink transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
                    >
                      Join workspace
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-2">
                  <div>
                    <h3 className="font-bold text-lg text-abyssal-ink font-display uppercase tracking-wide">
                      {team.name}
                    </h3>
                    <p className="text-xs text-abyssal-ink font-bold opacity-80">
                      {teamMembers.length} active collaborators
                    </p>
                  </div>

                  <div className="space-y-3">
                    {teamMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 bg-pure-white border-2 border-abyssal-ink p-4 rounded-[20px] shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]"
                      >
                        <div className="w-9 h-9 rounded-full bg-pure-white border-2 border-abyssal-ink flex items-center justify-center font-bold text-abyssal-ink text-xs overflow-hidden shadow-sm">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              className="w-full h-full object-cover animate-in fade-in"
                            />
                          ) : (
                            getInitials(m.full_name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-abyssal-ink truncate font-display uppercase tracking-wide">
                            {m.full_name}
                          </p>
                          {m.id === profileId && (
                            <p className="text-[10px] text-digital-orange font-bold uppercase tracking-wider">
                              You
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLeaveTeam}
                    className="w-full relative overflow-hidden rounded-[800px] py-3 text-sm font-bold tracking-wide text-red-600 bg-pure-white border-4 border-abyssal-ink hover:bg-basalt-canvas/40 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none mt-2"
                  >
                    Leave Workspace
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

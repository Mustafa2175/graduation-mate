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
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
  const { getFreshUser, setCurrentUser, clearCurrentUser } = useCurrentUser();

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
      console.error("Failed to load profile for edit:", error);
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
        console.error("[profile/edit] logout failed", error);
        toast.error(
          "Signed out locally, but Supabase sign-out reported an error. Redirecting...",
        );
      }
    } catch (error) {
      console.error("[profile/edit] logout:unexpected-error", error);
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
    <div className="min-h-screen bg-[#00172B] text-white relative overflow-hidden font-sans pb-28">
      {/* Fullscreen Looping Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        webkit-playsinline="true"
        x5-playsinline="true"
        poster="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />
      {/* Dark overlay to give depth and contrast */}
      <div className="absolute inset-0 bg-black/50 z-0 pointer-events-none" />

      {/* Cinematic Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-20 pb-10 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 gap-6">
        <div className="space-y-2 text-center sm:text-left animate-fade-rise">
          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl sm:text-6xl font-normal leading-[0.95] tracking-tight text-white"
          >
            Refine your{" "}
            <em className="not-italic text-neutral-400">creative</em> space.
          </h1>
          <p className="text-sm text-neutral-400 font-sans animate-fade-rise-delay">
            Update your profile parameters and team interactions
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 disabled:text-red-400/50 transition-colors bg-white/5 border border-white/10 px-5 py-3 rounded-full backdrop-blur-md cursor-pointer disabled:cursor-not-allowed animate-fade-rise shrink-0"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      <div className="w-full mx-auto space-y-8 relative z-10 px-4 sm:px-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10 animate-fade-rise-delay-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section className="liquid-glass rounded-3xl p-6 flex justify-center border border-white/5">
              <AvatarUpload
                currentUrl={avatarPreview}
                onSelect={handleAvatarSelect}
              />
            </section>

            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-2xl font-normal text-white/90 tracking-wide border-b border-white/5 pb-2"
              >
                Basic Info
              </h2>
              <Input
                id="full_name"
                label="Full Name *"
                placeholder="e.g. Ahmed Ali"
                labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                {...register("full_name")}
                error={errors.full_name?.message}
              />
              <Input
                id="department"
                label="Department"
                placeholder="e.g. Computer Science"
                labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                {...register("department")}
                error={errors.department?.message}
              />
              <Input
                id="gpa"
                label="GPA (0–4)"
                type="number"
                step="0.01"
                placeholder="e.g. 3.5"
                labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                {...register("gpa")}
                error={errors.gpa?.message}
              />
            </section>

            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-2xl font-normal text-white/90 tracking-wide border-b border-white/5 pb-2"
              >
                Academic Track
              </h2>

              <div className="relative flex flex-col gap-1.5 w-full">
                <label
                  htmlFor="track-search"
                  className="text-white/70 font-medium text-xs tracking-wider uppercase"
                >
                  Track *
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
                    placeholder="Search for your desired track (e.g. Data Science)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                    autoComplete="off"
                  />

                  {isTrackDropdownOpen && filteredTrackOptions.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-neutral-950 py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {filteredTrackOptions.map((option) => (
                        <li
                          key={option}
                          onMouseDown={() => {
                            setTrackSearchTerm(option);
                            setValue("track", option, { shouldValidate: true });
                            setIsTrackDropdownOpen(false);
                          }}
                          className="relative cursor-pointer select-none px-4 py-2.5 transition-colors text-white hover:bg-white/10"
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.track && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.track.message}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-2xl font-normal text-white/90 tracking-wide border-b border-white/5 pb-2"
              >
                Skills
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
                  placeholder="Type a skill + Enter"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="rounded-xl bg-white text-[#00172B] px-5 text-sm font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Add
                </button>
              </div>

              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).length >
                0 && (
                <div className="pt-2">
                  <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider font-semibold">
                    Suggested
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 12)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setSkills([...skills, skill])}
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 hover:bg-white/15 hover:text-white transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/5 px-3.5 py-1 text-xs font-medium text-white"
                    >
                      {skill}{" "}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-white/40 hover:text-white ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-2xl font-normal text-white/90 tracking-wide border-b border-white/5 pb-2"
              >
                About
              </h2>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bio"
                  className="text-white/70 font-medium text-xs tracking-wider uppercase"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell teammates about yourself..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-white transition-all"
                />
                <p className="text-[10px] text-neutral-400 text-right">
                  {bio.length}/300
                </p>
              </div>
              <Input
                id="linkedin_url"
                label="LinkedIn URL *"
                type="url"
                placeholder="https://linkedin.com/in/..."
                labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                {...register("linkedin_url")}
                error={errors.linkedin_url?.message}
              />
              <Input
                id="whatsapp_number"
                label="WhatsApp Number *"
                placeholder="+201234567890"
                labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                {...register("whatsapp_number")}
                error={errors.whatsapp_number?.message}
              />
            </section>

            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <h2
                style={{ fontFamily: "'Instrument Serif', serif" }}
                className="text-2xl font-normal text-white/90 tracking-wide border-b border-white/5 pb-2"
              >
                Team Status
              </h2>
              <Toggle
                checked={isAvailable}
                onChange={setIsAvailable}
                label="Available for new teams"
                labelClassName="text-white font-semibold"
              />
              <div className="flex flex-col gap-1.5 pt-2">
                <label
                  htmlFor="team_status"
                  className="text-white/70 font-medium text-xs tracking-wider uppercase"
                >
                  Team Status *
                </label>
                <select
                  id="team_status"
                  {...register("team_status")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white transition-all cursor-pointer"
                >
                  <option className="text-neutral-900" value="LOOKING">
                    Looking for a team
                  </option>
                  <option className="text-neutral-900" value="COMPLETE">
                    Team complete
                  </option>
                  <option className="text-neutral-900" value="LOOKING_FOR_MORE">
                    Looking for more members
                  </option>
                </select>
              </div>
              {teamStatus === "LOOKING_FOR_MORE" && (
                <Input
                  id="looking_for_role"
                  label="Looking for role"
                  placeholder="e.g. Frontend Developer"
                  labelClassName="text-white/70 font-medium text-xs tracking-wider uppercase"
                  className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                  {...register("looking_for_role")}
                  error={errors.looking_for_role?.message}
                />
              )}
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden rounded-full py-4 text-base font-semibold tracking-wide text-neutral-950 bg-white hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer shadow-sm mt-4 flex items-center justify-center"
            >
              {isSubmitting ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </form>

          <div className="space-y-8">
            {/* TEAM SYSTEM SECTION */}
            <section className="space-y-5 liquid-glass rounded-3xl p-6 border border-white/5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                  className="text-2xl font-normal text-white/90 tracking-wide"
                >
                  Your Team
                </h2>
                <button
                  onClick={copyId}
                  className="text-xs text-white/60 hover:text-white font-semibold uppercase tracking-wider transition-colors cursor-pointer bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                >
                  Copy Invite ID
                </button>
              </div>

              {!team ? (
                <div className="space-y-6 pt-2">
                  {/* Create Team */}
                  <div className="space-y-3">
                    <label className="text-white/70 font-medium text-xs tracking-wider uppercase">
                      Create a Team
                    </label>
                    <Input
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="Enter Team Name"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTeam}
                      className="w-full relative overflow-hidden rounded-full py-3 text-sm font-semibold tracking-wide text-neutral-950 bg-white hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      Create new team
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                      OR
                    </span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  {/* Join Team */}
                  <div className="space-y-3">
                    <label className="text-white/70 font-medium text-xs tracking-wider uppercase">
                      Join Existing Team
                    </label>
                    <Input
                      value={joinIdInput}
                      onChange={(e) => setJoinIdInput(e.target.value)}
                      placeholder="Team Invite Token"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:ring-white focus:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleJoinTeam}
                      className="w-full relative overflow-hidden rounded-full py-3 text-sm font-semibold tracking-wide text-neutral-950 bg-white hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      Join existing team
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-2">
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {team.name}
                    </h3>
                    <p className="text-xs text-white/50">
                      {teamMembers.length} members
                    </p>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
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
                          <p className="text-sm font-semibold text-white truncate">
                            {m.full_name}
                          </p>
                          {m.id === profileId && (
                            <p className="text-[10px] text-white/40 font-medium">
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
                    className="w-full relative overflow-hidden rounded-full py-3 text-sm font-semibold tracking-wide text-white bg-red-950/40 hover:bg-red-950/60 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer shadow-md mt-2"
                  >
                    Leave Team
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

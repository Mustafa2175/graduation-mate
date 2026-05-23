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
import Toggle from "@/components/ui/Toggle";
import AvatarUpload from "@/components/profile/AvatarUpload";
import type { Profile, Team } from "@/types";

// Import Modular Decomposed Sections
import BasicInfoSection from "@/components/profile/edit/BasicInfoSection";
import AcademicTrackSection from "@/components/profile/edit/AcademicTrackSection";
import SkillsSection from "@/components/profile/edit/SkillsSection";
import AboutSection from "@/components/profile/edit/AboutSection";
import TeamSection from "@/components/profile/edit/TeamSection";

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
  commitment_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const { getFreshUser, setCurrentUser, clearCurrentUser } = useCurrentUser();

  const [isAvailable, setIsAvailable] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [trackSearchTerm, setTrackSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Strict Team states
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
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
      commitment_level: (["LOW", "MEDIUM", "HIGH"].includes(data.commitment_level) ? data.commitment_level : "MEDIUM") as any,
    });
    setSkills(data.skills ?? []);
    setIsAvailable(data.is_available);
    setAvatarPreview(data.avatar_url);
    setTrackSearchTerm(data.track || "");

    if (data.team_id) {
      const t = await getTeamById(data.team_id);
      const m = await getTeamMembers(data.team_id);
      setTeam(t as Team);
      setTeamMembers(m as Profile[]);
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
        commitment_level: data.commitment_level,
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
    if (profileId) {
      navigator.clipboard.writeText(profileId);
      toast.success("Your Profile ID copied!");
    }
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

            <BasicInfoSection register={register} errors={errors} />

            <AcademicTrackSection
              trackSearchTerm={trackSearchTerm}
              setTrackSearchTerm={setTrackSearchTerm}
              setValue={setValue}
              errors={errors}
            />

            <SkillsSection skills={skills} setSkills={setSkills} />

            <AboutSection
              register={register}
              bioLength={bio.length}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />

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
            <TeamSection
              team={team}
              teamMembers={teamMembers}
              profileId={profileId}
              teamNameInput={teamNameInput}
              setTeamNameInput={setTeamNameInput}
              joinIdInput={joinIdInput}
              setJoinIdInput={setJoinIdInput}
              handleCreateTeam={handleCreateTeam}
              handleJoinTeam={handleJoinTeam}
              handleLeaveTeam={handleLeaveTeam}
              copyId={copyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

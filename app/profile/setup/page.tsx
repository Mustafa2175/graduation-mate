"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { updateProfile, upsertProfileContacts } from "@/lib/queries/profiles";
import { joinTeam } from "@/lib/queries/teams";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

// Import Wizard Steps
import StepIdentity from "./steps/StepIdentity";
import StepTrack from "./steps/StepTrack";
import StepSkills from "./steps/StepSkills";
import StepTeamSize from "./steps/StepTeamSize";
import StepSocial from "./steps/StepSocial";

export type SetupDraft = {
  full_name: string;
  email?: string;
  password?: string;
  department: string;
  gpa: number;
  track: string;
  skills: string[];
  is_available?: boolean;
  team_status?: "LOOKING" | "COMPLETE" | "LOOKING_FOR_MORE";
  looking_for_role?: string;
  team_invite_code?: string;
  bio: string;
  linkedin_url: string;
  whatsapp_number: string;
  avatar_url: string;
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const { setCurrentUser } = useAuth();

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<Partial<SetupDraft>>({
    track: "",
    team_status: "LOOKING",
    skills: [],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cinematic Background Video States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(0);

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = async (partial: Partial<SetupDraft>) => {
    const updatedDraft = { ...draft, ...partial };
    setDraft(updatedDraft);

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Step 5 Submit
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        // 1. Authenticate / Signup
        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email: updatedDraft.email!,
            password: updatedDraft.password!,
            options: {
              data: {
                full_name: updatedDraft.full_name,
              },
            },
          });

        if (signUpError || !authData.user) {
          throw new Error(
            signUpError?.message || "Failed to sign up auth user",
          );
        }

        // 2. Update existing profile (created by database trigger)
        const { data: profile, error } = await updateProfile(authData.user.id, {
          full_name: updatedDraft.full_name!,
          department: updatedDraft.department || null,
          gpa: updatedDraft.gpa ? Number(updatedDraft.gpa) : null,
          track: updatedDraft.track! as any,
          skills: updatedDraft.skills || [],
          commitment_level: "MEDIUM",
          bio: updatedDraft.bio || null,
          is_available: updatedDraft.is_available !== false,
          team_status: updatedDraft.team_status || "LOOKING",
          looking_for_role: updatedDraft.looking_for_role || null,
        });

        if (error || !profile)
          throw new Error(error?.message || "Failed to create profile");

        const { error: contactsError } = await upsertProfileContacts(
          authData.user.id,
          {
            linkedin_url: updatedDraft.linkedin_url || null,
            whatsapp_number: updatedDraft.whatsapp_number || null,
          },
        );
        if (contactsError)
          throw new Error(contactsError.message || "Failed to save contacts");

        // 2. Upload Avatar if selected
        if (avatarFile) {
          const fileExt = avatarFile.name.split(".").pop();
          const filePath = `${profile.id}/avatar.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, { upsert: true });

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from("avatars")
              .getPublicUrl(filePath);
            await updateProfile(profile.id, {
              avatar_url: publicUrl.publicUrl,
            });
          } else {
            toast.error("Profile saved, but avatar upload failed.");
          }
        }

        // 3. Join team if invite code was provided
        if (
          updatedDraft.team_status === "COMPLETE" &&
          updatedDraft.team_invite_code
        ) {
          try {
            await joinTeam(updatedDraft.team_invite_code, profile.id);
            toast.success("Joined team successfully!");
          } catch (e: any) {
            toast.error(
              "Profile created, but failed to join team: " + e.message,
            );
          }
        }

        // Populate the auth context so useAuth.getFreshUser()
        // returns the correct profile ID everywhere (discover, my-team, etc.).
        // The Supabase cookie session handles server-side auth; this entry
        // is the client-side fast-path used by useSwipe and other hooks.
        setCurrentUser(authData.user.id, updatedDraft.full_name!);
        toast.success("Welcome to GenieStudio!");
        router.replace("/discover");
      } catch (e: any) {
        toast.error(e.message || "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-body pb-28 bg-basalt-canvas text-abyssal-ink">
      <div className="w-full mx-auto space-y-8 relative z-10 px-4 sm:px-6 max-w-xl">
        {/* Onboarding Header */}
        <div className="space-y-4 pt-16 pb-6 text-center animate-fade-rise">
          <p className="gm-kicker">
            Brand Vault Setup
          </p>
          <h1 className="text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">
            Create your Brand Vault.
          </h1>
          <p className="text-abyssal-ink font-semibold text-xs sm:text-sm max-w-md mx-auto leading-relaxed pt-1 opacity-85">
            Define your visual presets, target channels, and tone guidelines to begin generating on-brand content.
          </p>
        </div>

        {/* Segmented Progress Bar */}
        <div className="flex gap-2.5 max-w-md mx-auto py-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                "h-3 flex-1 rounded-full transition-all duration-300 border-2 border-abyssal-ink",
                step <= currentStep
                  ? "bg-digital-orange shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]"
                  : "bg-pure-white",
              )}
            />
          ))}
        </div>

        {/* Form Wizard Stage */}
        <div className="bg-transparent relative z-10 pt-2 animate-fade-rise-delay-2">
          {currentStep === 1 && (
            <StepIdentity
              draft={draft}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={false}
            />
          )}

          {currentStep === 2 && (
            <StepTrack
              draft={draft}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={false}
            />
          )}

          {currentStep === 3 && (
            <StepSkills
              draft={draft}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={false}
            />
          )}

          {currentStep === 4 && (
            <StepTeamSize
              draft={draft}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={false}
            />
          )}

          {currentStep === 5 && (
            <StepSocial
              draft={draft}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={true}
              avatarPreview={avatarPreview}
              onAvatarSelect={handleAvatarSelect}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

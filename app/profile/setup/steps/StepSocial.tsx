"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { StepProps } from "./types";

const schema = z.object({
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  linkedin_url: z.union([z.string().url("Must be a valid URL"), z.literal("")]),
  whatsapp_number: z
    .string()
    .regex(
      /^\+?\d{7,15}$/,
      "Enter a valid international number (e.g. +201234567890)",
    ),
});

type FormInput = z.infer<typeof schema>;

interface StepSocialProps extends StepProps {
  avatarPreview: string | null;
  onAvatarSelect: (file: File) => void;
  isSubmitting: boolean;
}

export default function StepSocial({
  draft,
  onNext,
  onBack,
  avatarPreview,
  onAvatarSelect,
  isSubmitting,
}: StepSocialProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: draft.bio || "",
      linkedin_url: draft.linkedin_url || "",
      whatsapp_number: draft.whatsapp_number || "",
    },
  });

  const bioText = watch("bio") ?? "";

  const onSubmit = (data: FormInput) => {
    onNext({
      bio: data.bio || "",
      linkedin_url: data.linkedin_url || "",
      whatsapp_number: data.whatsapp_number || "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <section className="bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-6 flex justify-center shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
        <div className="relative group">
          <AvatarUpload currentUrl={avatarPreview} onSelect={onAvatarSelect} />
        </div>
      </section>

      {/* Social Details */}
      <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] animate-reveal">
        <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-3">
          Brand Details & Contacts
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
            className="w-full rounded-xl border border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-violet transition-all font-semibold"
          />
          <p className="text-[10px] text-abyssal-ink font-bold text-right mt-1">
            {bioText.length}/300
          </p>
          {errors.bio && (
            <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
          )}
        </div>

        <Input
          id="linkedin_url"
          label="Brand Website / LinkedIn URL (optional)"
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

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          className="gm-btn gm-btn-secondary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gm-btn gm-btn-primary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none font-bold"
        >
          {isSubmitting ? "Creating Workspace..." : "Build Brand Vault"}
        </Button>
      </div>
    </form>
  );
}

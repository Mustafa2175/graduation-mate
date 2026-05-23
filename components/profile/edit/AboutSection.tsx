"use client";

import Input from "@/components/ui/Input";
import { UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";

interface AboutSectionProps {
  register: UseFormRegister<any>;
  bioLength: number;
  errors: any;
  watch: any;
  setValue: any;
}

export default function AboutSection({ register, bioLength, errors, watch, setValue }: AboutSectionProps) {
  const commitment = watch("commitment_level") || "MEDIUM";

  return (
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
          {bioLength}/300
        </p>
      </div>

      {/* Commitment Level Segmented Selector */}
      <div className="flex flex-col gap-2 pt-2">
        <label className="text-white/70 font-medium text-xs tracking-wider uppercase">
          Commitment Level *
        </label>
        <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-2xl p-1 relative">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => {
            const isSelected = commitment === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setValue("commitment_level", level, { shouldValidate: true })}
                className={cn(
                  "relative py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer overflow-hidden z-10",
                  isSelected
                    ? "bg-white text-neutral-950 shadow-[0_4px_15px_rgba(255,255,255,0.2)] font-bold scale-[1.02]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {level === "LOW" && "Low"}
                {level === "MEDIUM" && "Medium"}
                {level === "HIGH" && "High"}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-neutral-400 transition-all duration-300">
          {commitment === "LOW" && "⚠️ Seeking relaxed involvement (2-5 hrs/week)."}
          {commitment === "MEDIUM" && "✨ Seeking balanced involvement (5-10 hrs/week)."}
          {commitment === "HIGH" && "🔥 Seeking high-intensity, dedicated effort (10+ hrs/week)."}
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
  );
}

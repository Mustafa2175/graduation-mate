"use client";

import Input from "@/components/ui/Input";
import { UseFormRegister } from "react-hook-form";

interface BasicInfoSectionProps {
  register: UseFormRegister<any>;
  errors: any;
}

export default function BasicInfoSection({ register, errors }: BasicInfoSectionProps) {
  return (
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
  );
}

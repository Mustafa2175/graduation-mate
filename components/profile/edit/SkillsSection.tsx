"use client";

import { useState } from "react";
import { SUGGESTED_SKILLS } from "@/lib/constants";

interface SkillsSectionProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
}

export default function SkillsSection({ skills, setSkills }: SkillsSectionProps) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    setSkills(skills.filter((s) => s !== skill));

  return (
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

      {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).length > 0 && (
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
  );
}

"use client";

import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { TRACK_OPTIONS } from "@/lib/constants";

interface AcademicTrackSectionProps {
  trackSearchTerm: string;
  setTrackSearchTerm: (val: string) => void;
  setValue: UseFormSetValue<any>;
  errors: any;
}

export default function AcademicTrackSection({
  trackSearchTerm,
  setTrackSearchTerm,
  setValue,
  errors,
}: AcademicTrackSectionProps) {
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);

  const filteredTrackOptions = TRACK_OPTIONS.filter((option) =>
    option.toLowerCase().includes(trackSearchTerm.toLowerCase()),
  );

  return (
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
  );
}

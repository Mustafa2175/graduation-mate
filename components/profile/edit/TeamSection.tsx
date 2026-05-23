"use client";

import Input from "@/components/ui/Input";
import { getInitials } from "@/lib/utils";

interface TeamSectionProps {
  team: any;
  teamMembers: any[];
  profileId: string | null;
  teamNameInput: string;
  setTeamNameInput: (val: string) => void;
  joinIdInput: string;
  setJoinIdInput: (val: string) => void;
  handleCreateTeam: () => void;
  handleJoinTeam: () => void;
  handleLeaveTeam: () => void;
  copyId: () => void;
}

export default function TeamSection({
  team,
  teamMembers,
  profileId,
  teamNameInput,
  setTeamNameInput,
  joinIdInput,
  setJoinIdInput,
  handleCreateTeam,
  handleJoinTeam,
  handleLeaveTeam,
  copyId,
}: TeamSectionProps) {
  return (
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
          type="button"
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
                      alt={m.full_name}
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
  );
}

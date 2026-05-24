"use client";

import { useState, useMemo } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { StepProps } from "./types";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "Flutter Developer",
  "Android Developer",
  "iOS Developer",
  "UI/UX Designer",
  "Product Manager",
  "Project Manager",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Prompt Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Specialist",
  "QA Engineer",
  "Game Developer",
  "Embedded Systems Engineer",
  "Researcher",
  "Technical Writer",
];

const TRACK_TO_ROLE_MAP: Record<string, string> = {
  "Data Science": "Data Scientist",
  "Data Analysis": "Data Analyst",
  "Data Engineering": "Data Engineer",
  "Artificial Intelligence": "AI Engineer",
  "Backend Development": "Backend Developer",
  "Frontend Development": "Frontend Developer",
  "Full Stack Development": "Full Stack Developer",
  "Mobile App Development": "Mobile Developer",
  Cybersecurity: "Cybersecurity Specialist",
  DevOps: "DevOps Engineer",
  "Cloud Computing": "Cloud Engineer",
  "Game Development": "Game Developer",
  "UI/UX Design": "UI/UX Designer",
  "Machine Learning": "Machine Learning Engineer",
};

interface SearchableRoleSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function SearchableRoleSelector({
  id,
  label,
  value,
  onChange,
  placeholder = "Search for a role...",
  error,
}: SearchableRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredRoles = ROLE_OPTIONS.filter((role) =>
    role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectOption = (option: string) => {
    setSearchTerm(option);
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredRoles.length - 1 ? prev + 1 : prev,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === "Enter") {
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredRoles.length
      ) {
        e.preventDefault();
        selectOption(filteredRoles[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5 w-full">
      <label
        htmlFor={id}
        className="text-black/75 font-semibold text-xs tracking-wider uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
          autoComplete="off"
        />

        {isOpen && filteredRoles.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-black/5 bg-white py-1 text-sm shadow-sm ring-1 ring-black/5 focus:outline-none">
            {filteredRoles.map((option, index) => (
              <li
                key={option}
                onMouseDown={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-black",
                  highlightedIndex === index
                    ? "bg-[var(--brand)] text-white font-semibold"
                    : "hover:bg-neutral-50",
                )}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function StepTeamSize({ draft, onNext, onBack }: StepProps) {
  // Load draft values
  const initialStatus =
    draft.team_status === "LOOKING"
      ? "solo"
      : draft.team_status === "LOOKING_FOR_MORE"
        ? "leader"
        : draft.team_status === "COMPLETE"
          ? "member"
          : "solo";

  const initialNeededRoles =
    draft.team_status === "LOOKING_FOR_MORE" && draft.looking_for_role
      ? draft.looking_for_role.split(", ").filter(Boolean)
      : [];

  const [collaborationStatus, setCollaborationStatus] = useState<
    "solo" | "leader" | "member"
  >(initialStatus);
  const [membersNeeded, setMembersNeeded] = useState<number>(
    initialNeededRoles.length || 1,
  );

  // Solo Student multiple preferred roles state
  const [preferredRoles, setPreferredRoles] = useState<string[]>(() => {
    if (draft.team_status === "LOOKING" && draft.looking_for_role) {
      return draft.looking_for_role.split(", ").filter(Boolean);
    }
    if (draft.track) {
      const mapped = TRACK_TO_ROLE_MAP[draft.track] || draft.track;
      // Verify mapped value exists in ROLE_OPTIONS to pre-populate cleanly
      const match = ROLE_OPTIONS.find(
        (r) => r.toLowerCase() === mapped.toLowerCase(),
      );
      return match ? [match] : [];
    }
    return [];
  });

  const [soloSearch, setSoloSearch] = useState("");
  const [isOpenSolo, setIsOpenSolo] = useState(false);
  const [highlightedIndexSolo, setHighlightedIndexSolo] = useState(-1);

  const [neededRoles, setNeededRoles] = useState<string[]>(() => {
    if (initialNeededRoles.length > 0) {
      return initialNeededRoles;
    }
    return [""];
  });

  const [teamInviteCode, setTeamInviteCode] = useState("");
  const [myRole, setMyRole] = useState(
    draft.team_status === "COMPLETE" ? draft.looking_for_role || "" : "",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSoloRoles = useMemo(() => {
    const q = soloSearch.trim().toLowerCase();
    const unselected = ROLE_OPTIONS.filter((r) => !preferredRoles.includes(r));
    if (!q) return unselected.slice(0, 8);
    return unselected
      .filter((role) => role.toLowerCase().includes(q))
      .slice(0, 8);
  }, [soloSearch, preferredRoles]);

  const selectSoloRole = (role: string) => {
    if (!preferredRoles.includes(role)) {
      setPreferredRoles([...preferredRoles, role]);
    }
    setSoloSearch("");
    setIsOpenSolo(false);
    setHighlightedIndexSolo(-1);
  };

  const handleKeyDownSolo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpenSolo) {
        setIsOpenSolo(true);
      } else {
        setHighlightedIndexSolo((prev) =>
          prev < filteredSoloRoles.length - 1 ? prev + 1 : prev,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpenSolo) {
        setHighlightedIndexSolo((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        isOpenSolo &&
        highlightedIndexSolo >= 0 &&
        highlightedIndexSolo < filteredSoloRoles.length
      ) {
        selectSoloRole(filteredSoloRoles[highlightedIndexSolo]);
      } else if (soloSearch.trim()) {
        const match = ROLE_OPTIONS.find(
          (r) => r.toLowerCase() === soloSearch.trim().toLowerCase(),
        );
        if (match) selectSoloRole(match);
      }
    } else if (e.key === "Escape") {
      setIsOpenSolo(false);
      setHighlightedIndexSolo(-1);
    }
  };

  const handleMembersNeededChange = (num: number) => {
    setMembersNeeded(num);
    setNeededRoles((prev) => {
      const copy = [...prev];
      if (copy.length < num) {
        while (copy.length < num) {
          copy.push("");
        }
      } else if (copy.length > num) {
        copy.splice(num);
      }
      return copy;
    });
  };

  const handleNeededRoleChange = (index: number, val: string) => {
    setNeededRoles((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (collaborationStatus === "leader") {
      neededRoles.forEach((role, i) => {
        if (!role) {
          newErrors[`role_${i}`] = `Role Needed #${i + 1} is required`;
        } else if (!ROLE_OPTIONS.includes(role)) {
          newErrors[`role_${i}`] = "Please select a valid role from the list";
        }
      });
    } else if (collaborationStatus === "member") {
      if (!teamInviteCode.trim()) {
        newErrors.teamInviteCode = "Team Invite Code is required";
      }
      if (!myRole) {
        newErrors.myRole = "My Role is required";
      } else if (!ROLE_OPTIONS.includes(myRole)) {
        newErrors.myRole = "Please select a valid role from the list";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit matching database schema values
    onNext({
      team_status:
        collaborationStatus === "solo"
          ? "LOOKING"
          : collaborationStatus === "leader"
            ? "LOOKING_FOR_MORE"
            : "COMPLETE",
      is_available: collaborationStatus !== "member",
      looking_for_role:
        collaborationStatus === "solo"
          ? preferredRoles.join(", ")
          : collaborationStatus === "leader"
            ? neededRoles.join(", ")
            : myRole,
      team_invite_code: teamInviteCode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
        <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-3">
          Workspace Preferences
        </h2>

        {/* Collaboration Status Cards */}
        <div className="flex flex-col gap-3">
          <span className="text-abyssal-ink font-bold text-xs tracking-wider uppercase">
            Collaboration Mode *
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: "solo",
                label: "Independent Creator",
                desc: "Looking to Collaborate",
                icon: "👤",
              },
              {
                id: "leader",
                label: "Brand Director",
                desc: "Building a Team",
                icon: "👥",
              },
              {
                id: "member",
                label: "Workspace Member",
                desc: "Already in a Team",
                icon: "🔐",
              },
            ].map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => {
                  setCollaborationStatus(status.id as any);
                  setErrors({});
                }}
                className={cn(
                  "p-4 rounded-2xl border-4 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px] font-semibold shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] active:translate-y-[2px] active:shadow-none",
                  collaborationStatus === status.id
                    ? "bg-digital-orange border-abyssal-ink text-pure-white"
                    : "bg-pure-white border-abyssal-ink text-abyssal-ink hover:bg-basalt-canvas/40",
                )}
              >
                <div className="text-xl mb-1">{status.icon}</div>
                <div>
                  <div className="font-display text-lg tracking-wide uppercase leading-none">
                    {status.label}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] leading-tight mt-1 font-bold",
                      collaborationStatus === status.id
                        ? "text-pure-white/80"
                        : "text-abyssal-ink/65",
                    )}
                  >
                    {status.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Solo Student Details (Optional + Pre-populated + Multi-selection) */}
        {collaborationStatus === "solo" && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* Selected Chips */}
            {preferredRoles.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pb-1">
                {preferredRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-[90px] bg-pure-white border-2 border-abyssal-ink px-4 py-1.5 text-xs font-bold text-abyssal-ink shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] animate-fade-in"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() =>
                        setPreferredRoles(
                          preferredRoles.filter((r) => r !== role),
                        )
                      }
                      className="text-abyssal-ink/60 hover:text-digital-orange ml-1 text-sm font-bold focus:outline-none cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative flex flex-col gap-1.5 w-full">
              <label
                htmlFor="preferred-roles-input"
                className="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
              >
                Target Capabilities (Optional)
              </label>
              <div className="relative">
                <input
                  id="preferred-roles-input"
                  type="text"
                  value={soloSearch}
                  onChange={(e) => {
                    setSoloSearch(e.target.value);
                    setIsOpenSolo(true);
                    setHighlightedIndexSolo(0);
                  }}
                  onFocus={() => setIsOpenSolo(true)}
                  onBlur={() => {
                    setTimeout(() => setIsOpenSolo(false), 200);
                  }}
                  onKeyDown={handleKeyDownSolo}
                  placeholder="Search and select roles you are interested in..."
                  className="w-full rounded-xl border border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 focus:outline-none focus:ring-1 focus:ring-cyber-violet focus:bg-white transition-all font-semibold"
                  autoComplete="off"
                />

                {isOpenSolo && filteredSoloRoles.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-rule bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {filteredSoloRoles.map((option, index) => (
                      <li
                        key={option}
                        onMouseDown={() => selectSoloRole(option)}
                        onMouseEnter={() => setHighlightedIndexSolo(index)}
                        className={cn(
                          "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-ink font-semibold",
                          highlightedIndexSolo === index
                            ? "bg-cyber-violet text-white font-bold"
                            : "hover:bg-sky-wash/40",
                        )}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team Leader Details */}
        {collaborationStatus === "leader" && (
          <div className="space-y-5 pt-2 animate-fade-in">
            {/* How many members do you need */}
            <div className="flex flex-col gap-2">
              <span className="text-abyssal-ink font-bold text-xs tracking-wider uppercase">
                Active Workspace Seats Needed *
              </span>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleMembersNeededChange(size)}
                    className={cn(
                      "py-3 rounded-xl text-md font-bold border-4 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[2px] active:shadow-none flex items-center justify-center",
                      membersNeeded === size
                        ? "bg-digital-orange border-abyssal-ink text-pure-white"
                        : "bg-pure-white border-abyssal-ink text-abyssal-ink hover:bg-basalt-canvas/40",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Role Inputs */}
            <div className="space-y-4 pt-2">
              {neededRoles.map((role, index) => (
                <SearchableRoleSelector
                  key={index}
                  id={`role-needed-${index}`}
                  label={`Role Needed #${index + 1} *`}
                  value={role}
                  onChange={(val) => {
                    handleNeededRoleChange(index, val);
                    setErrors((prev) => ({ ...prev, [`role_${index}`]: "" }));
                  }}
                  placeholder="Search for required role (e.g. Frontend Developer)"
                  error={errors[`role_${index}`]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Team Member Details */}
        {collaborationStatus === "member" && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <Input
              id="team-invite-code"
              label="Workspace Access Token *"
              value={teamInviteCode}
              onChange={(e) => {
                setTeamInviteCode(e.target.value);
                setErrors((prev) => ({ ...prev, teamInviteCode: "" }));
              }}
              placeholder="e.g. ABCD1234"
              labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
              className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl font-semibold"
              error={errors.teamInviteCode}
            />

            <SearchableRoleSelector
              id="my-role"
              label="My Creator Role *"
              value={myRole}
              onChange={(val) => {
                setMyRole(val);
                setErrors((prev) => ({ ...prev, myRole: "" }));
              }}
              placeholder="Search for your role (e.g. Full Stack Developer)"
              error={errors.myRole}
            />
          </div>
        )}
      </section>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onBack} className="gm-btn gm-btn-secondary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
          Back
        </Button>
        <Button type="submit" className="gm-btn gm-btn-primary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
          Continue to Brand Assets
        </Button>
      </div>
    </form>
  );
}

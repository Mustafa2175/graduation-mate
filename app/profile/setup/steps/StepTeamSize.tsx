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
      team_invite_code: teamInviteCode.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
        <h2
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-3xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2"
        >
          Team Preference
        </h2>

        {/* Collaboration Status Cards */}
        <div className="flex flex-col gap-3">
          <span className="text-black/75 font-semibold text-xs tracking-wider uppercase">
            Collaboration Status *
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "solo",
                label: "Solo Student",
                desc: "Looking to Join a Team",
                icon: "👤",
              },
              {
                id: "leader",
                label: "Team Leader",
                desc: "Looking for Members",
                icon: "👥",
              },
              {
                id: "member",
                label: "Team Member",
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
                  "p-4 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between min-h-[110px]",
                  collaborationStatus === status.id
                    ? "bg-black border-black text-white shadow-black/10"
                    : "bg-black/[0.02] border-black/10 text-black hover:bg-black/5",
                )}
              >
                <div className="text-xl mb-1">{status.icon}</div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">
                    {status.label}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] sm:text-[11px] leading-tight mt-0.5",
                      collaborationStatus === status.id
                        ? "text-white/70"
                        : "text-neutral-500",
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
              <div className="flex flex-wrap gap-2 pb-1">
                {preferredRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 border border-black/5 px-3.5 py-1 text-xs font-medium text-black animate-fade-in"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() =>
                        setPreferredRoles(
                          preferredRoles.filter((r) => r !== role),
                        )
                      }
                      className="text-black/40 hover:text-black ml-1 text-sm font-bold focus:outline-none"
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
                className="text-black/75 font-semibold text-xs tracking-wider uppercase"
              >
                Preferred Roles (Optional)
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
                  className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  autoComplete="off"
                />

                {isOpenSolo && filteredSoloRoles.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-black/5 bg-white py-1 text-sm shadow-sm ring-1 ring-black/5 focus:outline-none">
                    {filteredSoloRoles.map((option, index) => (
                      <li
                        key={option}
                        onMouseDown={() => selectSoloRole(option)}
                        onMouseEnter={() => setHighlightedIndexSolo(index)}
                        className={cn(
                          "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-black",
                          highlightedIndexSolo === index
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
            </div>
          </div>
        )}

        {/* Team Leader Details */}
        {collaborationStatus === "leader" && (
          <div className="space-y-5 pt-2 animate-fade-in">
            {/* How many members do you need */}
            <div className="flex flex-col gap-2">
              <span className="text-black/75 font-semibold text-xs tracking-wider uppercase">
                How many members do you need? *
              </span>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleMembersNeededChange(size)}
                    className={cn(
                      "py-3 rounded-xl text-md font-bold border transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center",
                      membersNeeded === size
                        ? "bg-[var(--brand)] border-[var(--brand)] text-white shadow-[var(--brand)]/20"
                        : "bg-black/[0.02] border-black/10 text-black/70 hover:bg-black/5",
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
              label="Team Invite Code *"
              value={teamInviteCode}
              onChange={(e) => {
                setTeamInviteCode(e.target.value.trim());
                setErrors((prev) => ({ ...prev, teamInviteCode: "" }));
              }}
              placeholder="e.g. 2ce84f82-f1eb-4881-8203-bd28a8c57ed9"
              labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
              className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
              error={errors.teamInviteCode}
            />

            <SearchableRoleSelector
              id="my-role"
              label="My Role *"
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
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue to Socials</Button>
      </div>
    </form>
  );
}

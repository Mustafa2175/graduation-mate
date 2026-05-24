"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getConnections, resolveProfileContacts, ConnectionItem } from "@/lib/queries/matches";
import { insertSwipe, checkMutualMatch } from "@/lib/queries/swipes";
import { createMatch } from "@/lib/queries/matches";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import { MessageCircle, Briefcase, Lock, Check, X, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import SkillBadge from "@/components/profile/SkillBadge";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";

function timeAgo(dateString: string) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function MatchesPage() {
  const router = useRouter();
  const { getFreshUser } = useAuth();
  const [mutual, setMutual] = useState<ConnectionItem[]>([]);
  const [incoming, setIncoming] = useState<ConnectionItem[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"invites" | "matches" | "sent">("invites");

  const loadConnections = async (updateTabs = true) => {
    const user = await getFreshUser();
    if (!user) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }
    setCurrentUserId(user.profileId);

    try {
      const data = await getConnections(user.profileId);
      setMutual(data.mutual);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
      if (updateTabs) {
        if (data.incoming.length > 0) setActiveTab("invites");
        else if (data.mutual.length > 0) setActiveTab("matches");
        else setActiveTab("invites");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (profileId: string) => {
    setActionLoading((prev) => ({ ...prev, [profileId]: true }));
    const acceptedInvite = incoming.find((item) => item.profile.id === profileId);
    if (acceptedInvite) {
      setIncoming((prev) => prev.filter((item) => item.profile.id !== profileId));
      setMutual((prev) => [
        {
          id: `optimistic-${profileId}`,
          type: "MUTUAL",
          profile: acceptedInvite.profile,
          matched_at: new Date().toISOString(),
          teamName: acceptedInvite.teamName,
          teamId: acceptedInvite.teamId,
          teammates: acceptedInvite.teammates,
          profile1_contact_shared: true,
          profile2_contact_shared: true,
        },
        ...prev,
      ]);
      setActiveTab("matches");
    }

    try {
      const { error: swipeError } = await insertSwipe(currentUserId, profileId, "RIGHT");
      if (swipeError && swipeError.code !== "23505") throw new Error(`Swipe Error: ${swipeError.message}`);
      const isMutual = await checkMutualMatch(currentUserId, profileId);
      if (!isMutual) {
        toast.error("Invite is no longer valid.");
        loadConnections();
        return;
      }
      const { error: matchError } = await createMatch(currentUserId, profileId);
      if (matchError && matchError.code !== "23505") throw new Error(`Match Error: ${matchError.message}`);
      loadConnections(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
      loadConnections();
    } finally {
      setActionLoading((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const handleDecline = async (profileId: string) => {
    setActionLoading((prev) => ({ ...prev, [profileId]: true }));
    setIncoming((prev) => prev.filter((item) => item.profile.id !== profileId));
    try {
      const { error: swipeError } = await insertSwipe(currentUserId, profileId, "LEFT");
      if (swipeError && swipeError.code !== "23505") throw new Error(`Swipe Error: ${swipeError.message}`);
      loadConnections(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to skip invite");
      loadConnections();
    } finally {
      setActionLoading((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="gm-page space-y-6 bg-[linear-gradient(to_bottom_right,var(--color-whisper-fade-blue),var(--color-whisper-fade-violet)/0.2)]">
        <div className="gm-skeleton h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="gm-skeleton aspect-[3/4] rounded-[32px]" />
          ))}
        </div>
      </div>
    );
  }

  const renderProfileCard = (item: ConnectionItem, type: "invites" | "matches" | "sent") => {
    const profile = item.profile;
    const { whatsapp_number, linkedin_url } = resolveProfileContacts(profile);
    const isActionLoading = actionLoading[profile.id];

    return (
      <article key={item.id} className="gm-card relative flex flex-col overflow-hidden bg-white border border-rule rounded-[32px] p-6 shadow-md hover:translate-y-[-2px] transition-transform duration-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="h-12 w-12 rounded-[16px] border border-rule object-cover shadow-sm" />
            ) : (
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-[16px] text-sm font-bold text-white shadow-sm font-display", getAvatarBg(profile.full_name))}>
                {getInitials(profile.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-ink font-display">{profile.full_name}</h3>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-silver-pine font-semibold">
                {type === "invites" ? `Shared ${timeAgo(item.matched_at)}` : type === "matches" ? `Saved ${timeAgo(item.matched_at)}` : `Submitted ${timeAgo(item.matched_at)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge color="border-rule text-ink rounded-[90px]">{getTrackBadge(profile.track).label}</Badge>
            {profile.skills?.slice(0, 3).map((skill: string) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>

          {type === "invites" && profile.bio && (
            <p className="line-clamp-3 border-t border-rule pt-3 text-sm leading-relaxed text-silver-pine">
              {profile.bio}
            </p>
          )}

          {item.teamName && (
            <div className="rounded-xl border border-rule bg-sky-wash/30 p-3 mt-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent font-semibold">
                Workspace: {item.teamName}
              </p>
              {item.teamId && (
                <Link href={`/teams/${item.teamId}`} className="mt-2 inline-flex items-center gap-1 text-xs text-electric-blue hover:text-luminous-blue font-semibold underline">
                  View workspace <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-t border-rule pt-4">
          {type === "matches" && (
            <>
              {whatsapp_number && (
                <button onClick={() => window.open(`https://wa.me/${whatsapp_number.replace(/\D/g, "")}`)} className="gm-btn gm-btn-primary flex-1 !min-h-11 text-xs rounded-[32px] font-semibold">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
              )}
              {linkedin_url && (
                <button onClick={() => window.open(linkedin_url)} className="gm-btn gm-btn-secondary flex-1 !min-h-11 text-xs rounded-[32px] font-semibold border border-rule hover:bg-slate-50">
                  <Briefcase className="h-4 w-4" /> Website
                </button>
              )}
              {!whatsapp_number && !linkedin_url && (
                <div className="flex-1 py-2.5 text-center text-xs text-silver-pine font-semibold">No assets provided</div>
              )}
            </>
          )}
          {type === "invites" && (
            <>
              <button disabled={isActionLoading} onClick={() => handleDecline(profile.id)} className="gm-btn gm-btn-secondary flex-1 !min-h-11 text-xs rounded-[32px] font-semibold border border-rule hover:bg-slate-50 cursor-pointer">
                <X className="h-4 w-4" /> Skip
              </button>
              <button disabled={isActionLoading} onClick={() => handleAccept(profile.id)} className="gm-btn gm-btn-primary flex-1 !min-h-11 text-xs rounded-[32px] font-semibold cursor-pointer">
                <Check className="h-4 w-4" /> Save to Vault
              </button>
            </>
          )}
          {type === "sent" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rule bg-sky-wash/20 py-2.5 font-mono text-[10px] font-semibold uppercase text-silver-pine">
              <Lock className="h-3.5 w-3.5" /> Pending Review
            </div>
          )}
        </div>
      </article>
    );
  };

  const renderTabButton = (id: "invites" | "matches" | "sent", label: string, count: number) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex min-h-12 flex-1 items-center justify-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer border-r-4 border-abyssal-ink last:border-r-0",
        activeTab === id
          ? "bg-digital-orange text-pure-white font-bold"
          : "bg-ash-white text-abyssal-ink hover:bg-basalt-canvas/40",
      )}
    >
      {label}
      {count > 0 && (
        <span className={cn(
          "rounded-[90px] px-2.5 py-0.5 text-[10px] font-bold border-2 border-abyssal-ink shadow-[1px_1px_0px_0px_rgba(7,6,7,1)]",
          activeTab === id ? "bg-pure-white text-abyssal-ink" : "bg-pixel-glare text-abyssal-ink"
        )}>
          {count}
        </span>
      )}
    </button>
  );

  const activeList = activeTab === "invites" ? incoming : activeTab === "matches" ? mutual : outgoing;

  return (
    <div className="gm-page bg-basalt-canvas">
      <div className="mb-6">
        <p className="gm-kicker">Saved Pipeline</p>
        <h1 className="mt-2 text-5xl font-display uppercase tracking-wider text-abyssal-ink leading-none">Campaign Pipeline</h1>
        <p className="mt-2 text-sm leading-relaxed text-abyssal-ink font-semibold">Manage incoming creative inputs, saved visual drafts, and pending workspace concepts.</p>
      </div>

      <div className="mb-8 flex border-4 border-abyssal-ink bg-ash-white rounded-[24px] overflow-hidden shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
        {renderTabButton("invites", "Shared Inputs", incoming.length)}
        {renderTabButton("matches", "Saved Vault", mutual.length)}
        {renderTabButton("sent", "Pending Review", outgoing.length)}
      </div>

      {activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] animate-reveal">
          <div>
            <h3 className="text-3xl font-display uppercase tracking-wider leading-none text-abyssal-ink">
              {activeTab === "invites" ? "No inputs yet" : activeTab === "matches" ? "No saved concepts" : "No pending reviews"}
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-abyssal-ink font-semibold opacity-85">
              {activeTab === "invites" ? "Keep your brand style parameters specific to capture target suggestions." : activeTab === "matches" ? "Develop custom content ideas or refresh trend signals in Trend Lab." : "Discover trending visual content to submit pipeline reviews."}
            </p>
          </div>
          {activeTab !== "invites" && (
            <Link href="/discover" className="block w-full max-w-[200px] pt-2">
              <Button className="gm-btn gm-btn-primary w-full rounded-[32px] shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">Discover Trends</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-3">
          {activeList.map((item) => renderProfileCard(item, activeTab))}
        </div>
      )}
    </div>
  );
}

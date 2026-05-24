"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getConnections, resolveProfileContacts, ConnectionItem } from "@/lib/queries/matches";
import { insertSwipe, checkMutualMatch } from "@/lib/queries/swipes";
import { createMatch } from "@/lib/queries/matches";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import {
  MessageCircle, Briefcase, Lock, Check, X, UserPlus, Users
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import SkillBadge from "@/components/profile/SkillBadge";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import {
  TeamInvitation,
  getMyTeamId,
  sendTeamInvitation,
  getPendingInvitationsReceived,
  getSentInvitations,
  acceptTeamInvitation,
  declineTeamInvitation,
} from "@/lib/queries/teamInvitations";

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

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi, we matched on the platform and I'd like to discuss collaboration."
);

function normalizeWhatsapp(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

function normalizeLinkUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function MatchesPage() {
  const router = useRouter();
  const { getFreshUser, isLoading: authLoading } = useAuth();

  const [mutual, setMutual] = useState<ConnectionItem[]>([]);
  const [incoming, setIncoming] = useState<ConnectionItem[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"invites" | "matches" | "sent">("invites");

  // Team invitation state
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [teamInvitesReceived, setTeamInvitesReceived] = useState<TeamInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);
  const [inviteActionLoading, setInviteActionLoading] = useState<Record<string, boolean>>({});

  const loadConnections = useCallback(async (updateTabs = true, showLoading = false) => {
    if (authLoading) return;
    if (showLoading) setIsLoading(true);
    setLoadError(null);
    const user = await getFreshUser();
    if (!user) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }
    setCurrentUserId(user.profileId);

    try {
      const [data, teamId, received, sent] = await Promise.all([
        getConnections(user.profileId),
        getMyTeamId(user.profileId),
        getPendingInvitationsReceived(user.profileId),
        getSentInvitations(user.profileId),
      ]);

      setMutual(data.mutual);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
      setMyTeamId(teamId);
      setTeamInvitesReceived(received);
      setSentInvitations(sent);

      if (updateTabs) {
        if (data.incoming.length > 0) setActiveTab("invites");
        else if (data.mutual.length > 0) setActiveTab("matches");
        else setActiveTab("invites");
      }
    } catch (err: any) {
      setLoadError(err.message || "Failed to load connections.");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, getFreshUser, router]);

  useEffect(() => {
    loadConnections(true, true);
  }, [loadConnections]);

  const handleAccept = async (profileId: string) => {
    setActionLoading(prev => ({ ...prev, [profileId]: true }));

    const acceptedInvite = incoming.find(item => item.profile.id === profileId);
    if (acceptedInvite) {
      setIncoming(prev => prev.filter(item => item.profile.id !== profileId));
      setMutual(prev => [{
        id: `optimistic-${profileId}`,
        type: 'MUTUAL',
        profile: acceptedInvite.profile,
        matched_at: new Date().toISOString(),
        teamName: acceptedInvite.teamName,
        teamId: acceptedInvite.teamId,
        teammates: acceptedInvite.teammates,
        profile1_contact_shared: true,
        profile2_contact_shared: true,
      }, ...prev]);
      setActiveTab("matches");
    }

    try {
      const { error: swipeError } = await insertSwipe(currentUserId, profileId, "RIGHT");
      if (swipeError && swipeError.code !== '23505') {
        throw new Error(`Swipe Error: ${swipeError.message}`);
      }

      const isMutual = await checkMutualMatch(currentUserId, profileId);
      if (isMutual) {
        const { error: matchError } = await createMatch(currentUserId, profileId);
        if (matchError && matchError.code !== '23505') {
          throw new Error(`Match Error: ${matchError.message}`);
        }
        toast.success("Match created! You can now contact each other.");
      } else {
        toast.error("Invite is no longer valid.");
        loadConnections();
        return;
      }

      loadConnections(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
      loadConnections();
    } finally {
      setActionLoading(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleDecline = async (profileId: string) => {
    setActionLoading(prev => ({ ...prev, [profileId]: true }));
    setIncoming(prev => prev.filter(item => item.profile.id !== profileId));

    try {
      const { error: swipeError } = await insertSwipe(currentUserId, profileId, "LEFT");
      if (swipeError && swipeError.code !== '23505') {
        throw new Error(`Swipe Error: ${swipeError.message}`);
      }
      loadConnections(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to skip invite");
      loadConnections();
    } finally {
      setActionLoading(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleSendTeamInvite = async (recipientProfileId: string) => {
    if (!myTeamId) {
      toast.error("Create or join a team before inviting teammates.");
      return;
    }
    setInviteActionLoading(prev => ({ ...prev, [recipientProfileId]: true }));
    try {
      await sendTeamInvitation(myTeamId, currentUserId, recipientProfileId);
      toast.success("Team invite sent!");
      // Optimistically add to sent list so the button greys out immediately
      setSentInvitations(prev => [
        ...prev,
        {
          id: `optimistic-${recipientProfileId}`,
          team_id: myTeamId,
          sender_profile_id: currentUserId,
          recipient_profile_id: recipientProfileId,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          responded_at: null,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite.");
    } finally {
      setInviteActionLoading(prev => ({ ...prev, [recipientProfileId]: false }));
    }
  };

  const handleAcceptTeamInvite = async (inv: TeamInvitation) => {
    setInviteActionLoading(prev => ({ ...prev, [inv.id]: true }));
    // Optimistic remove
    setTeamInvitesReceived(prev => prev.filter(i => i.id !== inv.id));
    try {
      await acceptTeamInvitation(inv.id, inv.team_id, currentUserId);
      toast.success(`You joined ${(inv.team as any)?.name ?? "the team"}!`);
      // Reload to reflect new team membership
      loadConnections(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept team invite.");
      // Restore if failed
      setTeamInvitesReceived(prev => [inv, ...prev]);
    } finally {
      setInviteActionLoading(prev => ({ ...prev, [inv.id]: false }));
    }
  };

  const handleDeclineTeamInvite = async (inv: TeamInvitation) => {
    setInviteActionLoading(prev => ({ ...prev, [inv.id]: true }));
    setTeamInvitesReceived(prev => prev.filter(i => i.id !== inv.id));
    try {
      await declineTeamInvitation(inv.id, currentUserId);
      toast.success("Invite declined.");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invite.");
      setTeamInvitesReceived(prev => [inv, ...prev]);
    } finally {
      setInviteActionLoading(prev => ({ ...prev, [inv.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-6">
        <div className="space-y-2">
          <div className="w-40 h-8 bg-gray-200 rounded-lg" />
          <div className="w-60 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-4">
           <div className="w-20 h-6 bg-gray-200 rounded" />
           <div className="w-20 h-6 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-red-100 p-8 text-center shadow-lg flex flex-col items-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-gray-900">Failed to load connections</h2>
          <p className="text-sm text-red-500 font-medium">
            {loadError}
          </p>
          <Button onClick={() => loadConnections(true, true)} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const renderProfileCard = (item: ConnectionItem, type: "invites" | "matches" | "sent") => {
    const profile = item.profile;
    const { whatsapp_number, linkedin_url } = resolveProfileContacts(profile);
    const isActionLoading = actionLoading[profile.id];

    // For mutual match cards: check if we already sent a PENDING invite to this person
    const alreadySentInvite = sentInvitations.some(
      inv => inv.recipient_profile_id === profile.id && inv.status === 'PENDING'
    );
    const isSendingInvite = inviteActionLoading[profile.id];

    const normalizedWhatsapp = whatsapp_number ? normalizeWhatsapp(whatsapp_number) : null;
    const normalizedLinkedin = linkedin_url ? normalizeLinkUrl(linkedin_url) : null;

    return (
      <div key={item.id} className="bg-white/70 backdrop-blur-2xl rounded-[24px] border border-white/60 shadow-sm overflow-hidden flex flex-col">
        {/* Header: Avatar & Name */}
        <div className="p-3 pb-0 flex flex-col items-center text-center space-y-2">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-50" />
          ) : (
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base ring-2 ring-gray-50", getAvatarBg(profile.full_name))}>
              {getInitials(profile.full_name)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{profile.full_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {type === "invites" ? `Interested ${timeAgo(item.matched_at)}` : type === "matches" ? `Matched ${timeAgo(item.matched_at)}` : `Sent ${timeAgo(item.matched_at)}`}
            </p>
          </div>
        </div>

        {/* Track Badge */}
        <div className="px-3 pt-2 flex justify-center">
          <Badge color={getTrackBadge(profile.track).color}>{getTrackBadge(profile.track).label}</Badge>
        </div>

        {/* Skills */}
        <div className="px-3 py-2 flex-1 flex flex-col justify-center min-h-[50px]">
          <div className="flex flex-wrap gap-1 justify-center">
            {profile.skills?.slice(0, 3).map((skill: string) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
            {(profile.skills?.length ?? 0) > 3 && (
              <span className="text-xs text-gray-400 self-center">+{profile.skills!.length - 3}</span>
            )}
          </div>
        </div>

        {/* Bio (Emphasize collaboration on invites) */}
        {type === "invites" && profile.bio && (
           <div className="px-3 py-2 text-xs text-gray-600 italic text-center border-t border-gray-50 line-clamp-3">
             &ldquo;{profile.bio}&rdquo;
           </div>
        )}

        {/* Team Details */}
        {item.teamName && (
          <div className="px-3 py-2.5 border-t border-gray-100 bg-neutral-50 text-left flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-dark-carbon uppercase tracking-wider line-clamp-1">
                👥 Team: {item.teamName}
              </p>
              {item.teammates && item.teammates.length > 0 ? (
                 <div className="mt-1 flex items-center gap-1.5">
                   <span className="text-xs text-gray-400 font-semibold shrink-0">Classmates:</span>
                   <div className="flex -space-x-1.5 overflow-hidden">
                     {item.teammates.map((t: any) =>
                       t.avatar_url ? (
                         <img key={t.id} src={t.avatar_url} alt={t.full_name} title={t.full_name} className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" />
                       ) : (
                         <div key={t.id} title={t.full_name} className={cn("inline-block h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center text-[8px] font-black text-white", getAvatarBg(t.full_name))}>
                           {getInitials(t.full_name)}
                         </div>
                       )
                     )}
                   </div>
                 </div>
              ) : (
                <p className="text-xs text-gray-400 italic mt-0.5">No teammates joined yet</p>
              )}
            </div>
            {item.teamId && (
              <Link href={`/teams/${item.teamId}`} className="p-1.5 rounded-lg bg-dark-carbon hover:bg-midnight-void text-absolute-zero transition-colors shrink-0 flex items-center justify-center" title="View Team Details">
                <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </Link>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-2 bg-gray-50 border-t border-gray-100 flex flex-col gap-1.5 min-h-[46px]">
          {type === "matches" && (
            <>
              {/* Contact row: WhatsApp + LinkedIn */}
              {(normalizedWhatsapp || normalizedLinkedin) && (
                <div className="flex gap-1.5">
                  {normalizedWhatsapp && (
                    <a
                      href={`https://wa.me/${normalizedWhatsapp}?text=${WHATSAPP_MESSAGE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-neon-green hover:bg-neon-green/90 text-polar-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-[11px] font-bold">WhatsApp</span>
                    </a>
                  )}
                  {normalizedLinkedin && (
                    <a
                      href={normalizedLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-dark-carbon hover:bg-midnight-void text-absolute-zero rounded-xl flex items-center justify-center transition-colors shadow-sm"
                      title="LinkedIn"
                    >
                      <Briefcase className="w-4 h-4 mr-1" />
                      <span className="text-[11px] font-bold">LinkedIn</span>
                    </a>
                  )}
                </div>
              )}
              {!normalizedWhatsapp && !normalizedLinkedin && (
                <div className="py-1.5 text-xs text-center text-gray-400 font-medium italic">No links provided</div>
              )}

              {/* Invite to Team row */}
              <button
                disabled={alreadySentInvite || isSendingInvite}
                onClick={() => handleSendTeamInvite(profile.id)}
                className={cn(
                  "w-full py-2 rounded-xl flex items-center justify-center transition-colors shadow-sm gap-1.5",
                  alreadySentInvite
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                )}
                title={alreadySentInvite ? "Invite already sent" : "Invite to Team"}
              >
                {alreadySentInvite ? (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Invite Sent</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">
                      {isSendingInvite ? "Sending..." : "Invite to Team"}
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {type === "invites" && (
            <>
              <button disabled={isActionLoading} onClick={() => handleDecline(profile.id)} className="flex-1 py-2 bg-deep-space hover:bg-midnight-void text-ash-gray rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50" title="Skip">
                <X className="w-4 h-4 mr-1" />
                <span className="text-[11px] font-bold">Skip</span>
              </button>
              <button disabled={isActionLoading} onClick={() => handleAccept(profile.id)} className="flex-1 py-2 bg-dark-carbon hover:bg-midnight-void text-absolute-zero rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50" title="Accept & Connect">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-[11px] font-bold">Accept & Connect</span>
              </button>
            </>
          )}

          {type === "sent" && (
            <div className="flex-1 flex items-center justify-center py-2 bg-gray-100 text-gray-400 rounded-xl gap-1 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-extrabold tracking-wider uppercase">Pending...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabButton = (id: "invites" | "matches" | "sent", label: string, count: number) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 relative",
        activeTab === id ? "border-dark-carbon text-dark-carbon" : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      <span className="flex items-center justify-center gap-1.5">
        {label}
        {count > 0 && (
          <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
            activeTab === id ? "bg-dark-carbon text-absolute-zero" : "bg-gray-200 text-gray-600"
          )}>
            {count}
          </span>
        )}
      </span>
    </button>
  );

  const activeList = activeTab === "invites" ? incoming : activeTab === "matches" ? mutual : outgoing;

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your incoming invites and mutual matches</p>
      </div>

      {/* ── Team Invitation Notifications ─────────────────────────────────── */}
      {teamInvitesReceived.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Team Invitations
              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                {teamInvitesReceived.length}
              </span>
            </h2>
          </div>
          <div className="space-y-2">
            {teamInvitesReceived.map(inv => {
              const sender = inv.sender as any;
              const team = inv.team as any;
              const isActing = inviteActionLoading[inv.id];
              return (
                <div
                  key={inv.id}
                  className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {sender?.avatar_url ? (
                      <img src={sender.avatar_url} alt={sender.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0", getAvatarBg(sender?.full_name ?? ""))}>
                        {getInitials(sender?.full_name ?? "?")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {sender?.full_name ?? "Someone"}
                      </p>
                      <p className="text-xs text-blue-600 font-medium truncate">
                        invited you to join <span className="font-black">{team?.name ?? "their team"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={isActing}
                      onClick={() => handleDeclineTeamInvite(inv)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={isActing}
                      onClick={() => handleAcceptTeamInvite(inv)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isActing ? "Joining..." : "Join Team"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-6">
        {renderTabButton("invites", "Invites", incoming.length)}
        {renderTabButton("matches", "Matches", mutual.length)}
        {renderTabButton("sent", "Sent", outgoing.length)}
      </div>

      {activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl">
            👻
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">
              {activeTab === "invites" ? "No invites yet" : activeTab === "matches" ? "No matches yet" : "No sent requests"}
            </h3>
            <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
              {activeTab === "invites" ? "Keep your profile updated to attract teammates." : activeTab === "matches" ? "Accept an invite or match on discover to start collaborating." : "Start discovering profiles to send invites."}
            </p>
          </div>
          {activeTab !== "invites" && (
            <Link href="/discover" className="block w-full max-w-[200px]">
              <Button>Find Teammates</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {activeList.map(item => renderProfileCard(item, activeTab))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getConnections, resolveProfileContacts, ConnectionItem } from "@/lib/queries/matches";
import { insertSwipe, checkMutualMatch } from "@/lib/queries/swipes";
import { createMatch } from "@/lib/queries/matches";
import { getInitials, getTrackBadge, getAvatarBg, cn } from "@/lib/utils";
import { MessageCircle, Briefcase, Lock, Check, X } from "lucide-react";
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
  const [currentUserId, setCurrentUserId] = useState<string>("");
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
      
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (profileId: string) => {
    setActionLoading(prev => ({ ...prev, [profileId]: true }));
    
    // Optimistic UI Update
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
        loadConnections(); // Revert optimistic update
        return;
      }
      
      // Load connections in background without updating tabs to prevent layout shift
      loadConnections(false); 
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to accept invite");
      // Revert optimistic update
      loadConnections();
    } finally {
      setActionLoading(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleDecline = async (profileId: string) => {
    setActionLoading(prev => ({ ...prev, [profileId]: true }));

    // Optimistic Update
    setIncoming(prev => prev.filter(item => item.profile.id !== profileId));

    try {
      const { error: swipeError } = await insertSwipe(currentUserId, profileId, "LEFT");
      if (swipeError && swipeError.code !== '23505') {
        throw new Error(`Swipe Error: ${swipeError.message}`);
      }
      loadConnections(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to skip invite");
      loadConnections(); // Revert
    } finally {
      setActionLoading(prev => ({ ...prev, [profileId]: false }));
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

  const renderProfileCard = (item: ConnectionItem, type: "invites" | "matches" | "sent") => {
    const profile = item.profile;
    const { whatsapp_number, linkedin_url } = resolveProfileContacts(profile);
    const isActionLoading = actionLoading[profile.id];

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
             "{profile.bio}"
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

        {/* Actions based on type */}
        <div className="p-2 bg-gray-50 border-t border-gray-100 flex gap-2 min-h-[46px] items-center justify-center">
          {type === "matches" && (
            <>
              {whatsapp_number && (
                <button onClick={() => window.open(`https://wa.me/${whatsapp_number.replace(/\D/g, "")}`)} className="flex-1 py-2 bg-neon-green hover:bg-neon-green/90 text-polar-white rounded-xl flex items-center justify-center transition-colors shadow-sm" title="WhatsApp">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>
              )}
              {linkedin_url && (
                <button onClick={() => window.open(linkedin_url)} className="flex-1 py-2 bg-dark-carbon hover:bg-midnight-void text-absolute-zero rounded-xl flex items-center justify-center transition-colors shadow-sm" title="LinkedIn">
                  <Briefcase className="w-4 h-4 mr-1" />
                  <span className="text-[11px] font-bold">LinkedIn</span>
                </button>
              )}
              {!whatsapp_number && !linkedin_url && (
                <div className="flex-1 py-2 text-xs text-center text-gray-400 font-medium italic">No links provided</div>
              )}
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

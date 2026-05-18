'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getProfileById } from '@/lib/queries/profiles'
import { getTeamById, getTeamMembers, leaveTeam, updateTeamDetails } from '@/lib/queries/teams'
import { getInitials, TRACK_COLORS, TRACK_LABELS, cn } from '@/lib/utils'
import { 
  Users, 
  Sparkles, 
  Compass, 
  ClipboardCheck, 
  Copy, 
  Briefcase, 
  Check,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SkillBadge from '@/components/profile/SkillBadge'

function getAvatarBg(name: string) {
  const colors = [
    'bg-gradient-to-tr from-pink-500 to-rose-500',
    'bg-gradient-to-tr from-purple-500 to-indigo-500',
    'bg-gradient-to-tr from-blue-500 to-cyan-500',
    'bg-gradient-to-tr from-emerald-500 to-teal-500',
    'bg-gradient-to-tr from-amber-500 to-orange-500',
    'bg-gradient-to-tr from-red-500 to-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export default function MyTeamPage() {
  const router = useRouter()
  const { getUser } = useCurrentUser()
  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  // Loading & State
  const [isLoading, setIsLoading] = useState(true)
  const [team, setTeam] = useState<any>(null)
  const [teammates, setTeammates] = useState<any[]>([])
  
  // Invitation Copy Feedback
  const [copied, setCopied] = useState(false)
  
  // Form Details (Project & Recruitment) - Optional
  const [teamName, setTeamName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectTechnologies, setProjectTechnologies] = useState('')
  const [rolesNeeded, setRolesNeeded] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Confirm Leave State
  const [confirmLeave, setConfirmLeave] = useState(false)

  const loadTeamData = async (profileId: string) => {
    try {
      const { data: profile } = await getProfileById(profileId)
      if (profile && profile.team_id) {
        const teamData = await getTeamById(profile.team_id)
        const members = await getTeamMembers(profile.team_id)
        
        setTeam(teamData)
        setTeammates(members || [])
        setTeamName(teamData?.name || '')
        
        // Deserialize json storage inside looking_for_role if applicable
        if (teamData?.looking_for_role) {
          try {
            const parsed = JSON.parse(teamData.looking_for_role)
            setProjectDescription(parsed.description || '')
            setProjectTechnologies(parsed.technologies || '')
            setRolesNeeded(parsed.rolesNeeded || '')
          } catch (e) {
            // Fallback: it's a raw string, show it as roles needed
            setRolesNeeded(teamData.looking_for_role)
            setProjectDescription('')
            setProjectTechnologies('')
          }
        } else {
          setProjectDescription('')
          setProjectTechnologies('')
          setRolesNeeded('')
        }
      } else {
        setTeam(null)
        setTeammates([])
      }
    } catch (err) {
      console.error('Error loading team dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    setCurrentUserId(user.profileId)
    loadTeamData(user.profileId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = () => {
    if (!team?.id) return
    navigator.clipboard.writeText(team.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveTeamDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team?.id) return
    
    setIsSavingDetails(true)
    setSaveSuccess(false)
    
    try {
      // Serialize optional fields as JSON in looking_for_role
      const serializedRole = JSON.stringify({
        description: projectDescription,
        technologies: projectTechnologies,
        rolesNeeded: rolesNeeded
      })
      
      const { error } = await updateTeamDetails(team.id, {
        name: teamName,
        looking_for_role: serializedRole
      })
      
      if (!error) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        // Refresh local data
        const updatedTeam = await getTeamById(team.id)
        setTeam(updatedTeam)
      }
    } catch (err) {
      console.error('Error updating team optional details:', err)
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleLeaveTeam = async () => {
    if (!team?.id || !currentUserId) return
    try {
      setIsLoading(true)
      await leaveTeam(team.id, currentUserId)
      setConfirmLeave(false)
      // Re-load to show empty state
      await loadTeamData(currentUserId)
    } catch (err) {
      console.error('Error leaving graduation team:', err)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="w-48 h-8 bg-gray-200 rounded-lg" />
          <div className="w-64 h-4 bg-gray-200 rounded" />
        </div>
        <div className="bg-gray-100 rounded-3xl h-60 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100 rounded-3xl h-80" />
          <div className="bg-gray-100 rounded-3xl h-80" />
        </div>
      </div>
    )
  }

  // State A: Not in a Team
  if (!team) {
    return (
      <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-center items-center">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-xl shadow-gray-50 flex flex-col items-center space-y-6 relative overflow-hidden">
          {/* Decorative subtle ambient gradient glows */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#ef4d23]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#ef4d23]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center text-5xl relative animate-bounce">
            👥
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#ef4d23] text-white text-[10px] font-black flex items-center justify-center animate-ping">
              ✨
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">You don't have a team yet</h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
              Graduation Mate works best when collaborating! Swipe on classmates, form matches, and create or join a team to coordinate your graduation project.
            </p>
          </div>

          <div className="w-full pt-4 flex flex-col space-y-3">
            <Link href="/discover" className="block w-full">
              <Button className="w-full flex items-center justify-center gap-2 font-bold shadow-md shadow-[#ef4d23]/10">
                <Compass className="w-4 h-4" /> Find Classmates (Discover)
              </Button>
            </Link>
            
            <Link href="/profile/edit" className="block w-full">
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2 border-gray-200 text-gray-700 font-semibold">
                {/* Custom UserCheck icon SVG */}
                <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
                Create or Join Team via Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // State B: In a Team
  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-8 pb-14">
      {/* Header Dashboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge color="orange">👥 Graduation Team</Badge>
            <span className="text-[10px] font-bold text-gray-400">Created {new Date(team.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            {team.name}
          </h1>
        </div>

        {/* Copy Invitation Token */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-6 shrink-0">
          <div className="text-left">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Invitation Token</p>
            <p className="text-xs font-mono font-bold text-gray-700 select-all tracking-tight max-w-[120px] truncate">{team.id}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className={cn(
              "p-2.5 rounded-xl border transition-all duration-200",
              copied 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
            title="Copy Invitation Code to invite classmates"
          >
            {copied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (2/3): Teammates Listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              👨‍🎓 Teammates <span className="text-xs font-bold text-gray-400">({teammates.length} total)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teammates.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              
              return (
                <div 
                  key={member.id}
                  className={cn(
                    "bg-white rounded-2xl border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md",
                    isCurrentUser ? "border-orange-200 bg-orange-50/5" : "border-gray-100"
                  )}
                >
                  {isCurrentUser && (
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                      You
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header: Name, Track */}
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.full_name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                        />
                      ) : (
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white",
                          getAvatarBg(member.full_name)
                        )}>
                          {getInitials(member.full_name)}
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 text-sm">{member.full_name}</h4>
                        <div className="mt-0.5">
                          <Badge color={TRACK_COLORS[member.track as keyof typeof TRACK_COLORS]}>
                            {TRACK_LABELS[member.track as keyof typeof TRACK_LABELS]}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2 text-left leading-relaxed">
                        {member.bio}
                      </p>
                    )}

                    {/* Technical Skills */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-start">
                        {member.skills.slice(0, 4).map((skill: string) => (
                          <SkillBadge key={skill} skill={skill} />
                        ))}
                        {member.skills.length > 4 && (
                          <span className="text-[9px] text-gray-400 self-center font-bold">
                            +{member.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Contact Vectors */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Contacts:</span>
                    <div className="flex items-center gap-1.5">
                      {member.whatsapp_number && (
                        <a 
                          href={`https://wa.me/${member.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hey%20${encodeURIComponent(member.full_name)}!%20Connecting%20from%20Graduation%20Mate!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="WhatsApp direct chat"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.035-4.326l.4.237c1.724 1.025 3.738 1.566 5.794 1.568 5.79 0 10.496-4.702 10.5-10.493.002-2.802-1.086-5.437-3.064-7.419C17.737 1.588 15.101.5 12.01.5 6.218.5 1.516 5.203 1.513 11c-.001 2.062.54 4.074 1.567 5.799l.259.439-1.031 3.766 3.784-1.03zm12.385-6.55c-.27-.136-1.602-.79-1.85-.88-.25-.09-.43-.136-.61.136-.18.27-.69.88-.85 1.056-.15.18-.3.2-.57.064-.27-.136-1.138-.419-2.169-1.338-.802-.716-1.344-1.602-1.5-1.875-.157-.273-.017-.42.119-.556.12-.12.27-.315.4-.472.13-.158.18-.27.27-.45.09-.18.04-.34-.02-.473-.06-.136-.61-1.477-.83-2.015-.22-.53-.44-.45-.61-.46-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.353-.26.284-1 .977-1 2.385s1.02 2.76 1.16 2.95c.14.19 2 3.05 4.85 4.276.68.29 1.21.467 1.63.6.69.22 1.32.19 1.81.116.55-.08 1.6-.656 1.83-1.288.225-.63.225-1.17.157-1.288-.07-.116-.25-.205-.52-.34z"/>
                          </svg>
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a 
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="LinkedIn profile"
                        >
                          {/* Custom self-contained LinkedIn SVG icon */}
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (1/3): Form & Optional Details */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-left">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
              {/* Custom Settings Gear SVG Icon */}
              <svg className="w-5 h-5 stroke-current fill-none text-gray-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Team Details
            </h2>

            <form onSubmit={handleSaveTeamDetails} className="space-y-4">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                  Team/Project Title
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. MedLink Telemedicine"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/20 focus:border-[#ef4d23]"
                />
              </div>

              {/* Project Abstract / Description - Optional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                    Project Abstract
                  </label>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">Optional</span>
                </div>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your graduation project goal, problems being solved, or final features..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/20 focus:border-[#ef4d23] resize-none"
                />
              </div>

              {/* Tech Stack - Optional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                    Preferred Technologies
                  </label>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">Optional</span>
                </div>
                <input
                  type="text"
                  value={projectTechnologies}
                  onChange={(e) => setProjectTechnologies(e.target.value)}
                  placeholder="e.g. Next.js, PyTorch, Flutter, Node.js"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/20 focus:border-[#ef4d23]"
                />
              </div>

              {/* Roles / Recruitment - Optional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                    Looking For Roles
                  </label>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">Optional</span>
                </div>
                <input
                  type="text"
                  value={rolesNeeded}
                  onChange={(e) => setRolesNeeded(e.target.value)}
                  placeholder="e.g. Backend Developer, UI Designer"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/20 focus:border-[#ef4d23]"
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSavingDetails}
                  className="w-full flex items-center justify-center gap-2 font-bold"
                >
                  {isSavingDetails ? (
                    <span className="flex items-center gap-2">
                      Saving...
                    </span>
                  ) : saveSuccess ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Changes Persisted!
                    </span>
                  ) : (
                    "Save Team Details"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Leave Team Card */}
          <div className="bg-red-50/5 border border-red-100 rounded-3xl p-5 text-left flex flex-col space-y-3">
            <div>
              <h3 className="font-bold text-red-900 text-sm">Danger Zone</h3>
              <p className="text-xs text-gray-500 leading-normal mt-0.5">
                Leaving the team will remove you from this group. If you are the last member, the team will be deleted.
              </p>
            </div>

            {confirmLeave ? (
              <div className="flex flex-col space-y-2 pt-1.5">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Are you absolutely sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLeaveTeam}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all"
                  >
                    Yes, Leave
                  </button>
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-3 border border-gray-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="w-full bg-white hover:bg-red-50 text-red-600 font-bold border border-red-200 text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all"
              >
                {/* Custom self-contained LogOut SVG Icon */}
                <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                Leave graduation team
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

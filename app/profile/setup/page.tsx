'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { upsertProfile } from '@/lib/queries/profiles'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'
import AvatarUpload from '@/components/profile/AvatarUpload'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().optional(),
  gpa: z.coerce.number().min(0).max(4).optional().or(z.literal('')),
  track: z.enum(['AI', 'DATA_SCIENCE', 'CYBERSECURITY', 'WEB_DEV', 'MOBILE_DEV', 'OTHER']),
  commitment_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  bio: z.string().max(300).optional(),
  linkedin_url: z.string().url('Must be a valid URL'),
  whatsapp_number: z.string().min(1, 'WhatsApp number is required'),
  team_status: z.enum(['LOOKING', 'COMPLETE', 'LOOKING_FOR_MORE']),
  looking_for_role: z.string().optional(),
})

const SUGGESTED_SKILLS = [
  'React', 'Next.js', 'Python', 'Machine Learning', 'Data Analysis', 
  'Figma', 'UI/UX', 'Node.js', 'PostgreSQL', 'Flutter', 
  'Java', 'C++', 'Cybersecurity', 'AWS', 'Docker', 'Swift'
]

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

export default function ProfileSetupPage() {
  const router = useRouter()
  const { setCurrentUser } = useCurrentUser()
  const [isAvailable, setIsAvailable] = useState(true)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoOpacity, setVideoOpacity] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { track: 'OTHER', commitment_level: 'MEDIUM', team_status: 'LOOKING' },
  })

  const teamStatus = watch('team_status')
  const bio = watch('bio') ?? ''

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed])
    setSkillInput('')
  }
  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill))

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Create Profile
      const { data: profile, error } = await upsertProfile({
        full_name: data.full_name,
        password: data.password,
        department: data.department || null,
        gpa: data.gpa ? Number(data.gpa) : null,
        track: data.track,
        skills,
        commitment_level: data.commitment_level,
        bio: data.bio || null,
        linkedin_url: data.linkedin_url || null,
        whatsapp_number: data.whatsapp_number || null,
        is_available: isAvailable,
        team_status: data.team_status,
        looking_for_role: data.looking_for_role || null,
      })

      if (error || !profile) throw new Error(error?.message || 'Failed to create profile')

      // 2. Upload Avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${profile.id}/avatar.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
        
        if (!uploadError) {
          const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath)
          await upsertProfile({ id: profile.id, avatar_url: publicUrl.publicUrl })
        } else {
          toast.error('Profile created, but failed to upload avatar.')
        }
      }

      setCurrentUser(profile.id, profile.full_name)
      toast.success('Welcome to TeamUp!')
      router.replace('/discover')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId: number

    const checkTime = () => {
      if (video.duration) {
        const current = video.currentTime
        const dur = video.duration
        const fadeTime = 0.5 // 0.5s fade duration

        let targetOpacity = 1

        // Fade in over 0.5s at the start
        if (current < fadeTime) {
          targetOpacity = current / fadeTime
        }
        // Fade out over 0.5s before the end
        else if (dur - current < fadeTime) {
          targetOpacity = (dur - current) / fadeTime
        }

        setVideoOpacity(Math.max(0, Math.min(1, targetOpacity)))
      }
      rafId = requestAnimationFrame(checkTime)
    }

    rafId = requestAnimationFrame(checkTime)

    // Manual looping on ended event with 100ms pause
    const handleEnded = () => {
      setVideoOpacity(0)
      setTimeout(() => {
        if (video) {
          video.currentTime = 0
          video.play().catch(() => {})
        }
      }, 100)
    }

    video.addEventListener('ended', handleEnded)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-black relative overflow-hidden font-sans pb-28">
      {/* Background Video Layer (z-0) with top: '300px' and custom seamless fade loop */}
      <div className="absolute inset-[300px_0_0_0] z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transition-opacity duration-200"
          style={{ opacity: videoOpacity }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
        />
        {/* Gradient overlays over the video */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />
      </div>

      <div className="w-full mx-auto space-y-8 relative z-10 px-4 sm:px-6 max-w-5xl">
        {/* Cinematic Header */}
        <div className="space-y-4 text-center pt-20 pb-10 animate-fade-rise">
          <h1 
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl sm:text-7xl font-normal leading-[0.95] tracking-tight text-black animate-fade-rise"
          >
            Where <em className="not-italic text-[#6F6F6F]">dreams</em> rise <br className="hidden sm:inline" /> through the <em className="not-italic text-[#6F6F6F]">silence.</em>
          </h1>
          <p className="text-[#6F6F6F] text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2 font-sans animate-fade-rise-delay">
            Designing platforms for deep work and pure flows. Let's build your eternal profile.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10 animate-fade-rise-delay-2">
          <div className="space-y-8">
            <section className="light-glass rounded-3xl p-6 flex justify-center border border-black/5 shadow-sm">
              <div className="relative group">
                <AvatarUpload currentUrl={avatarPreview} onSelect={handleAvatarSelect} />
              </div>
            </section>

            <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
              <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">Basic Info</h2>
              <Input id="full_name" label="Full Name *" placeholder="e.g. Ahmed Ali" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('full_name')} error={errors.full_name?.message} />
              <Input id="password" label="Password *" type="password" placeholder="Min. 6 characters" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('password')} error={errors.password?.message} />
              <Input id="department" label="Department" placeholder="e.g. Computer Science" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('department')} error={errors.department?.message} />
              <Input id="gpa" label="GPA (0–4)" type="number" step="0.01" placeholder="e.g. 3.5" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('gpa')} error={errors.gpa?.message} />
            </section>

            <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
              <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">Academic Track</h2>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="track" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Track *</label>
                <select id="track" {...register('track')} className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer">
                  <option className="text-neutral-900" value="AI">AI</option>
                  <option className="text-neutral-900" value="DATA_SCIENCE">Data Science</option>
                  <option className="text-neutral-900" value="CYBERSECURITY">Cybersecurity</option>
                  <option className="text-neutral-900" value="WEB_DEV">Web Dev</option>
                  <option className="text-neutral-900" value="MOBILE_DEV">Mobile Dev</option>
                  <option className="text-neutral-900" value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-black/75 font-semibold text-xs tracking-wider uppercase">Commitment Level *</span>
                <div className="flex gap-4">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" value={level} {...register('commitment_level')} className="w-4 h-4 accent-black bg-black/5 border-black/10" />
                      <span className="text-sm text-neutral-600 group-hover:text-black transition-colors capitalize">{level.charAt(0) + level.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
              <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">Skills</h2>
              <div className="flex gap-2">
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill + Enter"
                  className="flex-1 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                />
                <button type="button" onClick={addSkill} className="rounded-xl bg-black text-white px-5 text-sm font-semibold hover:bg-neutral-800 transition-colors">Add</button>
              </div>
              
              {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] text-black/40 mb-2 uppercase tracking-wider font-semibold">Suggested</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setSkills([...skills, skill])}
                        className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.02] px-3 py-1.5 text-[11px] font-medium text-black/70 hover:bg-black/5 hover:text-black transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-black/5">
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 rounded-full bg-black/5 border border-black/5 px-3.5 py-1 text-xs font-medium text-black">
                      {skill} <button type="button" onClick={() => removeSkill(skill)} className="text-black/40 hover:text-black ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
              <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">About</h2>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bio" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Bio</label>
                <textarea id="bio" {...register('bio')} rows={3} maxLength={300} placeholder="Tell teammates about yourself..." className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 resize-none focus:outline-none focus:ring-1 focus:ring-black transition-all" />
                <p className="text-[10px] text-neutral-400 text-right">{bio.length}/300</p>
              </div>
              <Input id="linkedin_url" label="LinkedIn URL *" type="url" placeholder="https://linkedin.com/in/..." labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('linkedin_url')} error={errors.linkedin_url?.message} />
              <Input id="whatsapp_number" label="WhatsApp Number *" placeholder="+201234567890" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('whatsapp_number')} error={errors.whatsapp_number?.message} />
            </section>

            <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
              <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-2xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">Team Status</h2>
              <Toggle checked={isAvailable} onChange={setIsAvailable} label="Available for new teams" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" />
              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="team_status" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Team Status *</label>
                <select id="team_status" {...register('team_status')} className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer">
                  <option className="text-neutral-900" value="LOOKING">Looking for a team</option>
                  <option className="text-neutral-900" value="COMPLETE">Team complete</option>
                  <option className="text-neutral-900" value="LOOKING_FOR_MORE">Looking for more members</option>
                </select>
              </div>
              {teamStatus === 'LOOKING_FOR_MORE' && <Input id="looking_for_role" label="Looking for role" placeholder="e.g. Frontend Developer" labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase" className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white" {...register('looking_for_role')} error={errors.looking_for_role?.message} />}
            </section>

            <button type="submit" disabled={isSubmitting} className="w-full relative overflow-hidden rounded-full py-4 text-base font-semibold tracking-wide text-white bg-black hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer shadow-xl mt-4 flex items-center justify-center">
              {isSubmitting ? 'Creating Profile...' : 'Begin Journey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentUser } = useAuth()
  const [serverError, setServerError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoOpacity, setVideoOpacity] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error || !authData.user) {
      setServerError('Email or password incorrect')
      return
    }

    // Get the profile to cache the full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authData.user.id)
      .single()

    setCurrentUser(authData.user.id, profile?.full_name || 'User')
    router.replace('/discover')
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
    <div className="min-h-screen bg-white text-black relative overflow-hidden font-sans flex flex-col items-center justify-center px-4 sm:px-6">
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

      <div className="w-full max-w-[440px] space-y-8 relative z-10 animate-fade-rise">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="font-instrument text-4xl sm:text-5xl tracking-tight text-black font-normal leading-none select-none">
            TeamUp<sup>®</sup>
          </div>
          <h1 
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-5xl sm:text-6xl font-normal leading-[0.95] tracking-tight text-black"
          >
            Welcome <em className="not-italic text-[#6F6F6F]">back.</em>
          </h1>
          <p className="text-sm text-[#6F6F6F]">Sign in to find your teammates</p>
        </div>

        {/* Light Glass Form Card */}
        <div className="light-glass rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              label="Email *"
              type="email"
              placeholder="Your university email"
              autoComplete="email"
              labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
              className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="Password *"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
              className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
              {...register('password')}
              error={errors.password?.message}
            />

            {serverError && (
              <p className="text-xs text-red-600 text-center font-medium bg-red-50 border border-red-200/50 py-2.5 rounded-xl">{serverError}</p>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full relative overflow-hidden rounded-full py-4 text-base font-semibold tracking-wide text-white bg-black hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer shadow-xl mt-4 flex items-center justify-center"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-[#6F6F6F]">
          New here?{' '}
          <Link
            href="/profile/setup"
            className="font-semibold text-black hover:underline underline-offset-4 transition-all"
          >
            Create your profile →
          </Link>
        </p>
      </div>
    </div>
  )
}

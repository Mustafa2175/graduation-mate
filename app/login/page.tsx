'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentUser } = useAuth()
  const [serverError, setServerError] = useState('')

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authData.user.id)
      .single()

    setCurrentUser(authData.user.id, profile?.full_name || 'User')
    router.replace('/discover')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-basalt-canvas px-4 py-12 text-abyssal-ink">
      {/* Decorative large background violet/yellow arcade blocks */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[350px] bg-cyber-violet opacity-5 rounded-bl-[160px] pointer-events-none" />
      <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[300px] bg-pixel-glare opacity-10 rounded-tr-[160px] pointer-events-none" />

      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between gap-10 rounded-[40px] border-4 border-abyssal-ink bg-ash-white p-8 shadow-[6px_6px_0px_0px_rgba(7,6,7,1)]">
          <Link href="/" className="font-wordmark text-2xl font-bold text-abyssal-ink hover:text-digital-orange transition-colors">
            GenieStudio
          </Link>
          <div className="space-y-4">
            <p className="gm-kicker">Welcome back</p>
            <h1 className="gm-title text-[clamp(2.5rem,6vw,4.5rem)]">
              Return to your Brand Vault.
            </h1>
            <p className="gm-subtitle font-semibold">
              Continue reviewing trend signals, content concepts, and active workspaces from your unified dashboard.
            </p>
          </div>
          <p className="font-mono text-xs text-abyssal-ink font-bold">
            New to GenieStudio?{' '}
            <Link href="/profile/setup" className="text-digital-orange underline">
              Build Brand Vault
            </Link>
          </p>
        </section>

        <section className="gm-panel p-8 shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] bg-ash-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <p className="gm-kicker">sign in</p>
              <h2 className="mt-2 text-2xl font-display uppercase tracking-wider text-abyssal-ink">
                Use your GenieStudio account
              </h2>
            </div>

            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="name@company.com"
              labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
              className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Your password"
              labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
              className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            {serverError && (
              <p className="rounded-[20px] border-2 border-danger bg-danger/10 px-4 py-3 text-sm text-danger font-semibold">
                {serverError}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className="gm-btn gm-btn-primary w-full shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none cursor-pointer">
              {isSubmitting ? 'Signing in' : 'Sign in'}
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

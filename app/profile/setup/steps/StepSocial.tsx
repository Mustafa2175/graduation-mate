'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AvatarUpload from '@/components/profile/AvatarUpload'
import { StepProps } from './types'

const schema = z.object({
  bio: z.string().max(300, 'Bio must be at most 300 characters').optional(),
  linkedin_url: z.string().url('Must be a valid URL'),
  whatsapp_number: z.string().min(1, 'WhatsApp number is required'),
})

type FormInput = z.infer<typeof schema>

interface StepSocialProps extends StepProps {
  avatarPreview: string | null
  onAvatarSelect: (file: File) => void
  isSubmitting: boolean
}

export default function StepSocial({
  draft,
  onNext,
  onBack,
  avatarPreview,
  onAvatarSelect,
  isSubmitting,
}: StepSocialProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: draft.bio || '',
      linkedin_url: draft.linkedin_url || '',
      whatsapp_number: draft.whatsapp_number || '',
    },
  })

  const bioText = watch('bio') ?? ''

  const onSubmit = (data: FormInput) => {
    onNext({
      bio: data.bio || '',
      linkedin_url: data.linkedin_url || '',
      whatsapp_number: data.whatsapp_number || '',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <section className="light-glass rounded-3xl p-6 flex justify-center border border-black/5 shadow-sm">
        <div className="relative group">
          <AvatarUpload currentUrl={avatarPreview} onSelect={onAvatarSelect} />
        </div>
      </section>

      {/* Social Details */}
      <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
        <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-3xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">
          Socials & Contact
        </h2>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Bio</label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={3}
            maxLength={300}
            placeholder="Tell teammates about yourself..."
            className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 resize-none focus:outline-none focus:ring-1 focus:ring-black transition-all"
          />
          <p className="text-[10px] text-neutral-400 text-right">{bioText.length}/300</p>
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <Input
          id="linkedin_url"
          label="LinkedIn URL *"
          type="url"
          placeholder="https://linkedin.com/in/..."
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('linkedin_url')}
          error={errors.linkedin_url?.message}
        />
        
        <Input
          id="whatsapp_number"
          label="WhatsApp Number *"
          placeholder="+201234567890"
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('whatsapp_number')}
          error={errors.whatsapp_number?.message}
        />
      </section>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Begin Journey'}
        </Button>
      </div>
    </form>
  )
}

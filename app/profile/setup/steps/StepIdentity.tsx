'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { StepProps } from './types'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  gpa: z.coerce.number().min(0).max(4, 'GPA must be between 0 and 4').optional().or(z.literal('')),
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

export default function StepIdentity({ draft, onNext }: StepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: draft.full_name || '',
      email: draft.email || '',
      password: draft.password || '',
      department: draft.department || '',
      gpa: draft.gpa !== undefined && draft.gpa !== null ? String(draft.gpa) : '',
    },
  })

  const onSubmit = (data: FormData) => {
    onNext({
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      department: data.department || '',
      gpa: data.gpa ? Number(data.gpa) : 0,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
        <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-3xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">
          Basic Identity
        </h2>
        
        <Input
          id="full_name"
          label="Full Name *"
          placeholder="e.g. Ahmed Ali"
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('full_name')}
          error={errors.full_name?.message}
        />
        <Input
          id="email"
          label="University Email *"
          type="email"
          placeholder="e.g. ahmed@university.edu"
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('email')}
          error={errors.email?.message}
        />
        
        <Input
          id="password"
          label="Password *"
          type="password"
          placeholder="Min. 6 characters"
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('password')}
          error={errors.password?.message}
        />
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Department *</label>
          <select
            id="department"
            {...register('department')}
            className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer"
          >
            <option value="" disabled>Select your department</option>
            <optgroup label="General">
              <option value="CS">CS</option>
              <option value="MM">MM</option>
              <option value="IS">IS</option>
              <option value="IT">IT</option>
              <option value="AI">AI</option>
              <option value="SE">SE</option>
            </optgroup>
            <optgroup label="National">
              <option value="CS_NATIONAL">CS (National)</option>
              <option value="MM_NATIONAL">MM (National)</option>
              <option value="IS_NATIONAL">IS (National)</option>
              <option value="IT_NATIONAL">IT (National)</option>
              <option value="AI_NATIONAL">AI (National)</option>
              <option value="SE_NATIONAL">SE (National)</option>
            </optgroup>
          </select>
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
        </div>
        
        <Input
          id="gpa"
          label="GPA (0–4)"
          type="number"
          step="0.01"
          placeholder="e.g. 3.5"
          labelClassName="text-black/75 font-semibold text-xs tracking-wider uppercase"
          className="bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/35 focus:ring-1 focus:ring-black focus:bg-white"
          {...register('gpa')}
          error={errors.gpa?.message}
        />
      </section>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Continue to Track
        </Button>
      </div>
    </form>
  )
}

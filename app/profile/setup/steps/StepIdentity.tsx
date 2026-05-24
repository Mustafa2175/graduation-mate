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
      <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
        <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-3">
          Creator Identity
        </h2>
        
        <Input
          id="full_name"
          label="Creator Name *"
          placeholder="e.g. Ahmed Ali"
          labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
          className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
          {...register('full_name')}
          error={errors.full_name?.message}
        />
        <Input
          id="email"
          label="Access Email *"
          type="email"
          placeholder="e.g. ahmed@creator.com"
          labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
          className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
          {...register('email')}
          error={errors.email?.message}
        />
        
        <Input
          id="password"
          label="Secure Password *"
          type="password"
          placeholder="Min. 6 characters"
          labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
          className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
          {...register('password')}
          error={errors.password?.message}
        />
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className="text-abyssal-ink font-bold text-xs tracking-wider uppercase">Primary Creator Domain *</label>
          <select
            id="department"
            {...register('department')}
            className="w-full rounded-xl border-2 border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink focus:outline-none focus:ring-1 focus:ring-cyber-violet transition-all cursor-pointer font-semibold"
          >
            <option value="" disabled>Select your creative domain</option>
            <optgroup label="SaaS & Tech Content">
              <option value="CS">Software Engineering & Development</option>
              <option value="MM">Multimedia Design & Marketing</option>
              <option value="IS">Information Systems & Tech Stacks</option>
              <option value="IT">IT Infrastructure & Operations</option>
              <option value="AI">Artificial Intelligence & ML Tools</option>
              <option value="SE">Software Architecture & Scaling</option>
            </optgroup>
            <optgroup label="Enterprise & Custom">
              <option value="CS_NATIONAL">Digital Product CS (Global)</option>
              <option value="MM_NATIONAL">Brand & Multimedia (Global)</option>
              <option value="IS_NATIONAL">Systems Integration (Global)</option>
              <option value="IT_NATIONAL">Enterprise Security (Global)</option>
              <option value="AI_NATIONAL">Advanced AI & NLP (Global)</option>
              <option value="SE_NATIONAL">Campaign Engineering (Global)</option>
            </optgroup>
          </select>
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
        </div>
        
        <Input
          id="gpa"
          label="Content Scale Capacity (1–4) *"
          type="number"
          step="0.01"
          placeholder="e.g. 4.00"
          labelClassName="text-abyssal-ink font-bold text-xs tracking-wider uppercase"
          className="bg-pure-white border-abyssal-ink text-abyssal-ink placeholder-ash-gray/60 focus:border-cyber-violet rounded-xl"
          {...register('gpa')}
          error={errors.gpa?.message}
        />
      </section>
 
      <div className="flex justify-end pt-4">
        <Button type="submit" className="gm-btn gm-btn-primary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
          Continue to Content Target
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { StepProps } from './types'
import { cn } from '@/lib/utils'

const TRACK_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Deep Learning",
  "Generative AI",
  "Natural Language Processing",
  "Computer Vision",
  "Robotics",
  "Data Science",
  "Data Analysis",
  "Data Engineering",
  "Big Data Engineering",
  "Business Intelligence",
  "Software Engineering",
  "Backend Development",
  "Frontend Development",
  "Full Stack Development",
  "Mobile App Development",
  "Android Development",
  "iOS Development",
  "Game Development",
  "Web Development",
  "Cloud Computing",
  "DevOps",
  "Site Reliability Engineering",
  "Cybersecurity",
  "Ethical Hacking",
  "Digital Forensics",
  "Network Security",
  "Blockchain Development",
  "Embedded Systems",
  "Internet of Things (IoT)",
  "Operating Systems",
  "Database Administration",
  "Database Engineering",
  "Distributed Systems",
  "Computer Networks",
  "System Programming",
  "Compiler Design",
  "Quantum Computing",
  "Bioinformatics",
  "Human-Computer Interaction",
  "UI/UX Design",
  "AR/VR Development",
  "Product Management",
  "Technical Project Management",
  "IT Support",
  "IT Administration",
  "Automation Engineering",
  "MLOps",
  "AIOps"
]

const schema = z.object({
  track: z.string().refine(val => TRACK_OPTIONS.includes(val), {
    message: "Please select a valid track from the list",
  }),
})

type FormInput = z.infer<typeof schema>

export default function StepTrack({ draft, onNext, onBack }: StepProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(draft.track || '')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      track: draft.track || '',
    },
  })

  const filteredOptions = TRACK_OPTIONS.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectOption = (option: string) => {
    setSearchTerm(option)
    setValue('track', option, { shouldValidate: true })
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isOpen) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault()
        selectOption(filteredOptions[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const onSubmit = (data: FormInput) => {
    onNext({
      track: data.track,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
        <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-3xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">
          Academic Track
        </h2>
        
        <div className="relative flex flex-col gap-1.5 w-full">
          <label htmlFor="track-search" className="text-black/75 font-semibold text-xs tracking-wider uppercase">Track *</label>
          <div className="relative">
            <input
              id="track-search"
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setValue('track', e.target.value, { shouldValidate: true })
                setIsOpen(true)
                setHighlightedIndex(0)
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                // Delay blur to allow clicks on dropdown options
                setTimeout(() => setIsOpen(false), 200)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search for your desired track (e.g. Data Science)"
              className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
              autoComplete="off"
            />
            
            {isOpen && filteredOptions.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-black/5 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                {filteredOptions.map((option, index) => (
                  <li
                    key={option}
                    onMouseDown={() => selectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-black",
                      highlightedIndex === index
                        ? "bg-violet-600 text-white font-semibold"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.track && <p className="text-red-500 text-xs mt-1">{errors.track.message}</p>}
        </div>
      </section>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue to Skills
        </Button>
      </div>
    </form>
  )
}

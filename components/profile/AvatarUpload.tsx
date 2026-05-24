'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentUrl: string | null
  onSelect: (file: File) => void
}

export default function AvatarUpload({ currentUrl, onSelect }: AvatarUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onSelect(acceptedFiles[0])
    }
  }, [onSelect])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative w-24 h-24 rounded-[16px] border-4 border-dashed border-abyssal-ink flex items-center justify-center overflow-hidden cursor-pointer transition-all group shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
          isDragActive ? "bg-pixel-glare" : "bg-ash-white",
          isDragReject && "border-danger bg-danger/10"
        )}
      >
        <input {...getInputProps()} />
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-abyssal-ink/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-pure-white" />
            </div>
          </>
        ) : (
          <div className="text-abyssal-ink/50 flex flex-col items-center gap-1">
            <Camera className="w-6 h-6 group-hover:text-digital-orange transition-colors stroke-[2.5]" />
          </div>
        )}
      </div>
      <p className="font-mono text-[9px] uppercase tracking-wider text-abyssal-ink font-bold">JPG, PNG OR WEBP (MAX 2MB)</p>
    </div>
  )
}

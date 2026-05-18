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
    <div className="flex flex-col items-center gap-2">
      <div
        {...getRootProps()}
        className={cn(
          "relative w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors group",
          isDragActive ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400 bg-white",
          isDragReject && "border-red-500 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="text-gray-400 flex flex-col items-center gap-1">
            <Camera className="w-6 h-6 group-hover:text-gray-600 transition-colors" />
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400">JPG, PNG or WebP (Max 2MB)</p>
    </div>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'TeamUp — Find Your Graduation Project Teammates',
  description: 'Swipe-based team matchmaking for university students. Find compatible teammates by specialization, skills, and work style.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="w-full max-w-5xl mx-auto bg-gray-50 min-h-screen pb-20 relative shadow-sm">
          {children}
        </div>
        <BottomNav />
        <Toaster position="top-center" />
      </body>
    </html>
  )
}

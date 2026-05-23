import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/AuthProvider'
import ErrorBoundary from '@/components/ErrorBoundary'

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
      <body className="bg-atmospheric min-h-screen">
        <AuthProvider>
          <ErrorBoundary>
            <div className="w-full max-w-5xl mx-auto bg-white/70 backdrop-blur-2xl min-h-screen pb-20 relative border-x border-white/40">
              {children}
            </div>
            <BottomNav />
            <Toaster position="top-center" />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}

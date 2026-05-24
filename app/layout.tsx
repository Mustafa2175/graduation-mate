import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'GenieStudio - AI Content Engineering Platform',
  description:
    'AI-powered creative platform for brands, creators, and teams to build cohesive, on-brand content.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="gm-shell min-h-screen">
        <AuthProvider>
          <div className="gm-app-frame relative pb-20">{children}</div>
          <BottomNav />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}

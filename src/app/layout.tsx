import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SessionProvider } from '@/components/auth/session-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'VA Jobs Online',
  description: 'Connect with top talent and exciting opportunities',
  appleWebApp: {
    capable: true,
    title: 'VA Jobs',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let timezone = 'Asia/Manila'
  try {
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    if (session?.user?.timezone) timezone = session.user.timezone
  } catch {}

  return (
    <html
      lang="en"
      data-timezone={timezone}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}

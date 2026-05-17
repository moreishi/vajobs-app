import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SessionProvider } from '@/components/auth/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalytics } from '@/components/seo/google-analytics'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://vajobs.online'

export const metadata: Metadata = {
  title: {
    default: 'VA Jobs Online — Hire Filipino Virtual Assistants',
    template: '%s | VA Jobs Online',
  },
  description:
    'Connect with top Filipino virtual assistants and remote talent. Hire skilled VAs, find premium remote jobs, and build your global team.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'VA Jobs Online',
    title: 'VA Jobs Online — Hire Filipino Virtual Assistants',
    description:
      'Connect with top Filipino virtual assistants and remote talent. Hire skilled VAs, find premium remote jobs, and build your global team.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VA Jobs Online — Hire Filipino Virtual Assistants',
    description:
      'Connect with top Filipino virtual assistants and remote talent.',
  },
  robots: {
    index: true,
    follow: true,
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-timezone="Asia/Manila"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider>
          {children}
          <Toaster />
          <GoogleAnalytics />
        </SessionProvider>
      </body>
    </html>
  )
}

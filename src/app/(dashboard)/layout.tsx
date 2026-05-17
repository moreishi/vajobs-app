import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { TimezoneSetter } from '@/components/ui/timezone-setter'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const timezone = session?.user?.timezone || 'Asia/Manila'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/20 to-background">
      <TimezoneSetter timezone={timezone} />
      <DashboardHeader
        userEmail={session?.user?.email}
        notificationBell={<NotificationBell />}
      />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}

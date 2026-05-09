import { auth } from '@/lib/auth'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col">
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

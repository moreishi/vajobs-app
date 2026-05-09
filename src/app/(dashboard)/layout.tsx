import Link from 'next/link'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold">Talent Hub</Link>
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-nowrap">
            <Link href="/dashboard/messages" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Messages
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Jobs
            </Link>
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Talents
            </Link>
            {session?.user?.email && (
              <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.email}</span>
            )}
            <NotificationBell />
            <SignOutForm />
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}

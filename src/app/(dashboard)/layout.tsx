import Link from 'next/link'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold">Talent Hub</Link>
          <nav className="flex items-center gap-2">
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Jobs
            </Link>
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Talents
            </Link>
            {session?.user?.email && (
              <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.email}</span>
            )}
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

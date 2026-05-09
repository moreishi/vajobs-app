import Link from 'next/link'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold">Talent Hub</span>
          <div className="flex items-center gap-2">
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Jobs
            </Link>
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Talents
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Dashboard
                </Link>
                <SignOutForm />
              </>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Sign in
                </Link>
                <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to Talent Hub
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with top talent and exciting opportunities.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), 'text-base')}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'text-base')}>
                  Get Started
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'text-base')}>
                  Sign in
                </Link>
              </>
            )}
            <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base')}>
              Browse Jobs
            </Link>
            <Link href="/talents" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base')}>
              Browse Talents
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

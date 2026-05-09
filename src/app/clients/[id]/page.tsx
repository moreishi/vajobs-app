import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { getClientProfile } from '@/actions/client-profile'

export const dynamic = 'force-dynamic'

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const isLoggedIn = !!session?.user

  const profile = await getClientProfile(id)
  if (!profile) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Talent Hub</Link>
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-nowrap">
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Jobs</Link>
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Talents</Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Dashboard</Link>
                <SignOutForm />
              </>
            ) : (
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          &larr; Back
        </Link>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">{profile.user.name || profile.user.email}</h1>
                {profile.title && (
                  <p className="text-muted-foreground">{profile.title}</p>
                )}
                {profile.company && (
                  <p className="text-sm text-muted-foreground">{profile.company}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{profile.jobCount} open position{profile.jobCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">About</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

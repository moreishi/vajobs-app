import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SignOutForm } from '@/components/auth/sign-out-form'

export const metadata = {
  title: 'Talent Profile - Talent Hub',
}

export const dynamic = 'force-dynamic'

export default async function TalentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const isLoggedIn = !!session?.user

  const { getProfile } = await import('@/actions/profile')
  const profile = await getProfile(id)

  if (!profile) {
    notFound()
  }

  const availabilityColor =
    profile.availability === 'available'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : profile.availability === 'busy'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Talent Hub</Link>
          <nav className="flex items-center gap-2">
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Talents
            </Link>
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Browse Jobs
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Dashboard
                </Link>
                <SignOutForm />
              </>
            ) : (
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/talents"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          &larr; Back to talents
        </Link>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">{profile.user.name || profile.user.email}</h1>
                {profile.headline && (
                  <p className="mt-1 text-lg text-muted-foreground">{profile.headline}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {profile.hourlyRate && <span>${profile.hourlyRate}/hr</span>}
                  {profile.experience && <span>{profile.experience} years experience</span>}
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${availabilityColor}`}>
                    {profile.availability}
                  </span>
                </div>
              </div>
            </div>

            {profile.skills.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">Skills</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">About</h2>
                <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {profile.bio}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

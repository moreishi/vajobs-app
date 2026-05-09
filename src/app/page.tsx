import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const [talentCount, jobCount, placementCount] = await Promise.all([
    prisma.profile.count({ where: { isPublic: true } }),
    prisma.jobPost.count({ where: { status: 'open' } }),
    prisma.application.count({ where: { status: 'accepted' } }),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">Talent Hub</Link>
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-nowrap">
            <Link href="/jobs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Jobs
            </Link>
            <Link href="/talents" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Talents
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Dashboard
                </Link>
                <SignOutForm />
              </>
            ) : (
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="max-w-4xl mx-auto px-4 py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Elite Virtual Assistants from{' '}
                <span className="text-primary">the Philippines</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Hand-picked, highly skilled Filipino talent ready to grow your business.
                English-proficient, tech-savvy, and wired for Western time zones.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: 'lg' }), 'text-base px-8')}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-2xl font-bold sm:text-3xl md:text-4xl">{talentCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Active VAs</p>
              </div>
              <div>
                <p className="text-2xl font-bold sm:text-3xl md:text-4xl">{jobCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Open Positions</p>
              </div>
              <div>
                <p className="text-2xl font-bold sm:text-3xl md:text-4xl">{placementCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Successful Placements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Philippine VAs */}
        <section className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Why Filipino Talent?</h2>
              <p className="mt-3 text-muted-foreground">
                The Philippines is one of the world&apos;s top sources of remote talent. Here&apos;s why businesses choose Filipino VAs.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'English Proficient',
                  desc: 'The Philippines is the third-largest English-speaking country in the world. Clear communication, no barriers.',
                },
                {
                  title: 'Time Zone Aligned',
                  desc: 'Filipino VAs work Western hours seamlessly. Your 9 AM is their prime time too.',
                },
                {
                  title: 'Highly Skilled',
                  desc: 'From admin support to tech, marketing, and creative — our VAs bring enterprise-grade expertise.',
                },
                {
                  title: 'Cost-Effective',
                  desc: 'Get top-tier talent at a fraction of local hiring costs. No overhead, no compromise on quality.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <h2 className="text-3xl font-bold tracking-tight text-center">How It Works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6 sm:p-8">
                <div className="mb-2 inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  For Clients
                </div>
                <h3 className="mt-3 text-xl font-semibold">Hire a Virtual Assistant</h3>
                <ol className="mt-6 space-y-4">
                  {[
                    'Post a job describing what you need',
                    'Browse VA profiles and reviews',
                    'Interview and hire the best match',
                    'Manage your VA through the platform',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link
                  href="/talents"
                  className={cn(buttonVariants({ className: 'mt-6' }), 'w-full')}
                >
                  Browse VAs
                </Link>
              </div>
              <div className="rounded-lg border bg-card p-6 sm:p-8">
                <div className="mb-2 inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  For Talents
                </div>
                <h3 className="mt-3 text-xl font-semibold">Get Hired as a VA</h3>
                <ol className="mt-6 space-y-4">
                  {[
                    'Create your professional profile',
                    'Set your skills, rate, and availability',
                    'Apply to jobs that match your expertise',
                    'Get hired and start working remotely',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: 'outline', className: 'mt-6' }), 'w-full')}
                >
                  Join as a VA
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Ready to grow your team?</h2>
              <p className="mt-3 text-muted-foreground">
                Join hundreds of businesses that have built their remote teams with Filipino talent.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/talents"
                  className={cn(buttonVariants({ size: 'lg' }), 'text-base px-8')}
                >
                  Find Your VA
                </Link>
                <Link
                  href="/jobs"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Talent Hub. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/talents" className="hover:text-foreground transition-colors">
              Find VAs
            </Link>
            <Link href="/jobs" className="hover:text-foreground transition-colors">
              Browse Jobs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

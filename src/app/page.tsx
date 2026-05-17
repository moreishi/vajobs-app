import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PublicHeader } from '@/components/layout/public-header'
import { PricingSection } from '@/components/subscriptions/pricing-section'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'Hire Top Filipino Virtual Assistants',
  description:
    'Find and hire skilled Filipino virtual assistants. Browse top talent, post jobs, and build your remote team with hand-picked VAs from the Philippines.',
  openGraph: {
    title: 'VA Jobs Online — Hire Top Filipino Virtual Assistants',
    description:
      'Find and hire skilled Filipino virtual assistants. Browse top talent, post jobs, and build your remote team.',
  },
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const [talentCount, jobCount, placementCount, recentJobs, recentReviews] = await Promise.all([
    prisma.profile.count({ where: { isPublic: true } }),
    prisma.jobPost.count({ where: { status: 'open' } }),
    prisma.application.count({ where: { status: 'accepted' } }),
    prisma.jobPost.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        shortDescription: true,
        location: true,
        salaryRange: true,
        type: true,
        skills: true,
      },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        rating: true,
        comment: true,
        reviewer: { select: { name: true, email: true } },
        reviewee: { select: { name: true, email: true } },
      },
    }),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VA Jobs Online',
            url: process.env.NEXT_PUBLIC_URL || 'https://vajobs.online',
            description:
              'Platform connecting businesses with Filipino virtual assistants and remote talent.',
            knowsAbout: ['Virtual Assistant', 'Remote Work', 'Filipino Talent', 'Outsourcing'],
            aggregateRating: talentCount > 0 ? {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              bestRating: '5',
              ratingCount: placementCount.toString(),
              itemReviewed: { '@type': 'Organization', name: 'VA Jobs Online' },
            } : undefined,
          }}
        />
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                Connecting businesses with elite remote talent
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Hire Top Virtual Assistants from{' '}
                <span className="text-primary">the Philippines</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Hand-picked, highly skilled Filipino talent ready to grow your business.
                English-proficient, tech-savvy, and wired for Western time zones.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: 'lg' }), 'text-base px-8')}
                >
                  Start Hiring
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

        {/* Stats */}
        <section className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums">{talentCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Active Talents</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums">{jobCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Open Positions</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums">{placementCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Successful Placements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs */}
        {recentJobs.length > 0 && (
          <section className="border-b">
            <div className="max-w-5xl mx-auto px-4 py-20">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Featured Jobs</h2>
                  <p className="mt-2 text-muted-foreground">Latest opportunities from top employers</p>
                </div>
                <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:inline-flex')}>
                  View All
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentJobs.map((job) => {
                  const skills = JSON.parse(job.skills) as string[]
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="group rounded-lg border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                        <span className="shrink-0 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                          {job.type?.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        {job.location && <span>{job.location}</span>}
                        {job.salaryRange && (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <span>{job.salaryRange}</span>
                          </>
                        )}
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  View All Jobs
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Why Philippine VAs */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Why Filipino Talent?</h2>
              <p className="mt-3 text-muted-foreground">
                The Philippines is one of the world&apos;s top sources of remote talent. Here&apos;s why businesses choose Filipino VAs.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                <div key={item.title} className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <h2 className="text-3xl font-bold tracking-tight text-center">How It Works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6 sm:p-8 transition-all hover:shadow-md">
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
                  Browse Talents
                </Link>
              </div>
              <div className="rounded-lg border bg-card p-6 sm:p-8 transition-all hover:shadow-md">
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
                  Join as a Talent
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* Testimonials */}
        {recentReviews.length > 0 && (
          <section className="border-b">
            <div className="max-w-5xl mx-auto px-4 py-20">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">What Our Users Say</h2>
                <p className="mt-3 text-muted-foreground">Real feedback from successful placements</p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {recentReviews.map((review) => (
                  <div key={review.id} className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={cn('h-4 w-4', i < review.rating ? 'text-amber-400' : 'text-muted-foreground/30')}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                    )}
                    <p className="mt-4 text-xs font-medium text-muted-foreground">
                      — {review.reviewer.name || review.reviewer.email}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Ready to grow your team?</h2>
              <p className="mt-3 text-muted-foreground">
                Join hundreds of businesses that have built their remote teams with Filipino talent.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: 'lg' }), 'text-base px-8')}
                >
                  Get Started Free
                </Link>
                <Link
                  href="/talents"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Talents
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
              Find Talents
            </Link>
            <Link href="/jobs" className="hover:text-foreground transition-colors">
              Browse Jobs
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

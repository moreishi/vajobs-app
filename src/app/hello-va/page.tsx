import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PublicHeader } from '@/components/layout/public-header'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find VA Jobs | VA Jobs Online',
  description: 'Premium remote jobs for Filipino Virtual Assistants. Work with international clients, earn in USD, and build a career from home.',
}

const CATEGORIES = [
  { icon: '📋', name: 'Executive Assistant' },
  { icon: '💬', name: 'Customer Support' },
  { icon: '📱', name: 'Social Media Manager' },
  { icon: '🎬', name: 'Video Editor' },
  { icon: '🎨', name: 'Graphic Designer' },
  { icon: '🛒', name: 'E-Commerce VA' },
  { icon: '📊', name: 'Bookkeeping / Finance' },
  { icon: '🔍', name: 'Lead Generation' },
  { icon: '🚀', name: 'SEO Specialist' },
  { icon: '✍️', name: 'Content Writer' },
  { icon: '🤖', name: 'AI Automation' },
  { icon: '🏠', name: 'Real Estate VA' },
  { icon: '📧', name: 'Email Marketing' },
  { icon: '📐', name: 'Project Manager' },
  { icon: '⚙️', name: 'CRM / Operations' },
]

const BENEFITS = [
  {
    title: 'Work from Anywhere',
    desc: 'No commute, no traffic. All our jobs are fully remote — work from the comfort of your home.',
  },
  {
    title: 'Competitive Pay',
    desc: 'Earn in US dollars. Entry-level roles start at $6–8/hr and experienced roles go up to $200/hr.',
  },
  {
    title: 'Flexible Hours',
    desc: 'Choose full-time positions or freelance gigs. You set your schedule and availability.',
  },
  {
    title: 'No Degree Required',
    desc: 'We care about your skills and attitude, not your diploma. Many successful VAs started with zero experience.',
  },
  {
    title: 'Grow Your Skills',
    desc: 'Learn AI tools, automation, project management, and more. Level up while you earn.',
  },
  {
    title: 'Long-Term Partnerships',
    desc: 'Our clients are looking for reliable VAs to grow with them. Many positions lead to permanent roles.',
  },
]

export default async function HelloVAPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const [jobCount, talentCount, placementCount] = await Promise.all([
    prisma.jobPost.count({ where: { status: 'open' } }),
    prisma.profile.count({ where: { isPublic: true } }),
    prisma.application.count({ where: { status: 'accepted' } }),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                🇵🇭 Built for Filipino talent, trusted by global businesses
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your Next{' '}
                <span className="text-emerald-600 dark:text-emerald-400">VA Job</span>{' '}
                is Waiting
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Premium remote jobs for Filipino Virtual Assistants. Work with international clients,
                earn in USD, and build a career — all from home.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'text-base px-8 bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  Join Free — Start Applying
                </Link>
                <Link
                  href="/jobs"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Open Jobs
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                No upfront fees. Create your profile and start applying today.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-emerald-600 dark:text-emerald-400">{jobCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Open Jobs</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-emerald-600 dark:text-emerald-400">{talentCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Active VAs</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-emerald-600 dark:text-emerald-400">{placementCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Successful Placements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Job categories */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Find Your Match</h2>
              <p className="mt-3 text-muted-foreground">
                From entry-level to advanced — there&apos;s a role for every skillset
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href="/jobs"
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <p className="font-medium leading-tight">{cat.name}</p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/jobs"
                className={cn(buttonVariants({ variant: 'outline' }), 'text-sm')}
              >
                View All Open Positions &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Why join */}
        <section className="border-b bg-gradient-to-b from-muted/20 to-muted/40">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Why Join VA Jobs Online?</h2>
              <p className="mt-3 text-muted-foreground">
                Thousands of Filipino VAs have found great opportunities here. Here&apos;s why:
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-3 text-muted-foreground">
                Getting started takes just a few minutes
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-4">
              {[
                {
                  step: '1',
                  title: 'Create Your Profile',
                  desc: 'Sign up and build your VA profile. Add your skills, experience, and hourly rate.',
                },
                {
                  step: '2',
                  title: 'Browse & Apply',
                  desc: 'Explore open positions across 15+ categories. Apply with a proposal and bid.',
                },
                {
                  step: '3',
                  title: 'Get Hired',
                  desc: 'Clients review your profile and reach out. Chat, interview, and land the job.',
                },
                {
                  step: '4',
                  title: 'Work & Grow',
                  desc: 'Start working, get paid, earn reviews, and build your reputation.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">What Filipino VAs Say</h2>
              <p className="mt-3 text-muted-foreground">Real stories from our community</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote: 'I started as an entry-level VA earning $7/hr. Within a year, I was promoted to team lead at $22/hr. This platform changed my life.',
                  name: 'Maria, 28',
                  role: 'Executive Assistant',
                },
                {
                  quote: 'The AI Automation Specialist role was exactly what I was looking for. The clients here actually value high-end skills and pay accordingly.',
                  name: 'Carlos, 34',
                  role: 'AI Automation VA',
                },
                {
                  quote: 'After years in BPO, I wanted to work from home. I found a Social Media Manager role here within a week. Best decision ever.',
                  name: 'Angela, 26',
                  role: 'Social Media Manager',
                },
              ].map((t) => (
                <div key={t.name} className="rounded-lg border bg-card p-6">
                  <svg className="h-6 w-6 text-emerald-500/40 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 border-t pt-3">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-emerald-500/10 via-background to-sky-500/10">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Ready to Start Your VA Journey?</h2>
              <p className="mt-3 text-muted-foreground">
                Join thousands of Filipino VAs already working with international clients. Your next opportunity is one click away.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'text-base px-8 bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  Create Your Free Profile
                </Link>
                <Link
                  href="/jobs"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Jobs First
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VA Jobs Online. Made for Filipino talent, everywhere.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/jobs" className="hover:text-foreground transition-colors">
              Browse Jobs
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              For Clients
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

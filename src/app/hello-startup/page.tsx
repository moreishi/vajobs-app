import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PublicHeader } from '@/components/layout/public-header'
import { PricingSection } from '@/components/subscriptions/pricing-section'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hire Filipino VAs | VA Jobs Online',
  description:
    'Find trusted Filipino virtual assistants ready to support your startup growth. VAJobs helps founders hire vetted remote talent for operations, marketing, admin, and more.',
}

const ROLES = [
  { icon: '📋', name: 'Executive Assistant', desc: 'Calendar, email, scheduling, and operations' },
  { icon: '💬', name: 'Customer Support', desc: 'Email, chat, tickets, and CRM' },
  { icon: '📱', name: 'Social Media Manager', desc: 'Content, engagement, and growth' },
  { icon: '🎬', name: 'Video Editor', desc: 'Short-form, captions, and motion graphics' },
  { icon: '🎨', name: 'Graphic Designer', desc: 'Social assets, ads, and branding' },
  { icon: '🛒', name: 'E-Commerce VA', desc: 'Shopify, listings, and fulfillment' },
  { icon: '📊', name: 'Bookkeeper', desc: 'Xero, QuickBooks, and reconciliation' },
  { icon: '🔍', name: 'Lead Generation', desc: 'Research, outreach, and appointment setting' },
  { icon: '🚀', name: 'SEO Specialist', desc: 'Keywords, on-page, and technical SEO' },
  { icon: '✍️', name: 'Content Writer', desc: 'Blogs, web copy, and email campaigns' },
  { icon: '🤖', name: 'AI Automation', desc: 'ChatGPT, Zapier, n8n workflows' },
  { icon: '⚙️', name: 'CRM / Operations', desc: 'HubSpot, GoHighLevel, pipeline mgmt' },
]

const WHY_FILIPINO = [
  {
    metric: '3rd',
    label: 'Largest English-speaking country',
    desc: 'Clear, neutral accent with a 98% literacy rate. No communication barriers.',
  },
  {
    metric: '12 hrs',
    label: 'Overlap with US business hours',
    desc: 'Filipino VAs work Western time zones seamlessly. Your 9 AM is their prime time.',
  },
  {
    metric: '60%',
    label: 'Lower cost vs local hiring',
    desc: 'Get top-tier talent at a fraction of the cost. No overhead, no benefits, no office space.',
  },
  {
    metric: '95%',
    label: 'Client satisfaction rate',
    desc: 'Businesses that hire Filipino VAs stick with them. Reliable, loyal, and highly skilled.',
  },
]

export default async function HelloStartupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const session = await auth()
  const isLoggedIn = !!session?.user
  const registerUrl = ref ? `/register?ref=${ref}` : '/register'

  const [talentCount, placementCount, jobCount] = await Promise.all([
    prisma.profile.count({ where: { isPublic: true } }),
    prisma.application.count({ where: { status: 'accepted' } }),
    prisma.jobPost.count({ where: { status: 'open' } }),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-sky-50 dark:bg-sky-950/30 px-4 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                🇵🇭 Hire top Filipino talent — remotely, reliably, affordably
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Build Your Team with{' '}
                <span className="text-sky-600 dark:text-sky-400">Filipino VAs</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Stop hiring locally and overpaying. Access a pool of highly skilled, English-proficient
                Filipino Virtual Assistants ready to grow your business — at half the cost.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={registerUrl}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'text-base px-8 bg-sky-600 hover:bg-sky-700'
                  )}
                >
                  Start Hiring — It&apos;s Free
                </Link>
                <Link
                  href="/talents"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Talents
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                No commitment required. Post a job and review profiles at no cost.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-sky-600 dark:text-sky-400">{talentCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Vetted Talents</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-sky-600 dark:text-sky-400">{jobCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Active Job Posts</p>
              </div>
              <div>
                <p className="text-3xl font-bold sm:text-4xl tabular-nums text-sky-600 dark:text-sky-400">{placementCount}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Successful Placements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Filipino */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Why Filipino VAs?</h2>
              <p className="mt-3 text-muted-foreground">
                The numbers speak for themselves. Here&apos;s why thousands of businesses choose Filipino talent.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_FILIPINO.map((item) => (
                <div key={item.metric} className="rounded-lg border bg-card p-6 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                  <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{item.metric}</p>
                  <p className="mt-1 text-sm font-medium">{item.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles you can hire for */}
        <section className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Roles You Can Fill</h2>
              <p className="mt-3 text-muted-foreground">
                From admin to automation — find the right VA for every function
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {ROLES.map((role) => (
                <div
                  key={role.name}
                  className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-lg mt-0.5">{role.icon}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{role.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works for clients */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-3 text-muted-foreground">
                From job post to hire in days, not weeks
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-4">
              {[
                {
                  step: '1',
                  title: 'Post a Job',
                  desc: 'Tell us what you need — role, skills, budget, and timeline. Takes 5 minutes.',
                },
                {
                  step: '2',
                  title: 'Receive Proposals',
                  desc: 'VAs apply with their profile, bid, and approach. Review and compare.',
                },
                {
                  step: '3',
                  title: 'Interview & Hire',
                  desc: 'Chat with candidates, schedule interviews, and pick the best fit.',
                },
                {
                  step: '4',
                  title: 'Manage & Scale',
                  desc: 'Use our platform to manage contracts, milestones, invoices, and payments.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What clients say */}
        <section className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Trusted by Founders &amp; CEOs</h2>
              <p className="mt-3 text-muted-foreground">Real feedback from businesses that hired through us</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote: 'We hired two VAs through this platform and both exceeded expectations. The talent pool here is genuinely impressive.',
                  name: 'David Chen',
                  role: 'Founder, SaaSify.io',
                },
                {
                  quote: 'We were spending $60k/yr on a local assistant. We found an equally skilled VA here for $18k/yr. Same quality, fraction of the cost.',
                  name: 'Sarah Mitchell',
                  role: 'COO, GrowthLab',
                },
                {
                  quote: 'The AI Automation VA we hired built us a Zapier pipeline that saves our team 20+ hours a week. Best hire we\'ve made all year.',
                  name: 'James Torres',
                  role: 'CTO, Nexus Digital',
                },
              ].map((t) => (
                <div key={t.name} className="rounded-lg border bg-card p-6">
                  <svg className="h-6 w-6 text-sky-500/40 mb-2" fill="currentColor" viewBox="0 0 24 24">
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

        {/* Platform features */}
        <section className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Hire &amp; Manage</h2>
              <p className="mt-3 text-muted-foreground">
                A complete platform — not just a job board
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'AI Talent Matching', desc: 'Get ranked suggestions of the best-fit VAs for your job based on skills and experience.' },
                { title: 'Real-Time Chat', desc: 'Message candidates instantly. No email ping-pong, no delays.' },
                { title: 'Interview Scheduling', desc: 'Built-in calendar with meeting links. Schedule and manage interviews in one place.' },
                { title: 'Contracts & Milestones', desc: 'Create contracts, set milestones, and track progress — all on the platform.' },
                { title: 'Invoicing & Payments', desc: 'Pay via Stripe, PayPal, or Wise. Invoices, receipts, and payment history included.' },
                { title: 'Skill Assessments', desc: 'Create custom tests to evaluate candidates before you hire.' },
              ].map((f) => (
                <div key={f.title} className="rounded-lg border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* CTA */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-sky-500/10 via-background to-indigo-500/10">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Ready to Scale Your Team?</h2>
              <p className="mt-3 text-muted-foreground">
                Join hundreds of businesses that have built high-performing teams with Filipino talent.
                Post your first job free — no credit card required.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={registerUrl}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'text-base px-8 bg-sky-600 hover:bg-sky-700'
                  )}
                >
                  Post a Job Free
                </Link>
                <Link
                  href="/talents"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base px-8')}
                >
                  Browse Talent Pool
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VA Jobs Online. Hire Filipino talent, scale your business.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/talents" className="hover:text-foreground transition-colors">
              Browse Talents
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Post a Job
            </Link>
            <Link href="/hello-va" className="hover:text-foreground transition-colors">
              For VAs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { JobCard } from '@/components/jobs/job-card'
import type { JobPost, JobType, JobStatus } from '@/types'

export const metadata = {
  title: 'Browse Jobs - Talent Hub',
  description: 'Browse open positions and find your next opportunity',
}

export default async function JobsPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const prismaJobs = await prisma.jobPost.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
  })

  const jobs: JobPost[] = prismaJobs.map(j => ({
    id: j.id,
    title: j.title,
    description: j.description,
    short_description: j.shortDescription,
    location: j.location,
    type: j.type as JobType,
    salary_range: j.salaryRange,
    skills: JSON.parse(j.skills) as string[],
    status: j.status as JobStatus,
    poster_id: j.posterId,
    poster_name: j.posterName,
    created_at: j.createdAt.toISOString(),
    updated_at: j.updatedAt.toISOString(),
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Talent Hub</Link>
          <nav className="flex items-center gap-2">
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
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Browse Jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Find your next opportunity
          </p>
        </div>

        {jobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job as JobPost} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">No open positions right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later for new opportunities.</p>
          </div>
        )}
      </main>
    </div>
  )
}

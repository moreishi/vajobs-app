import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { SignOutForm } from '@/components/auth/sign-out-form'
import { ApplyForm } from '@/components/jobs/apply-form'
import { SaveButton } from '@/components/jobs/save-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { JobPost, JobType, JobStatus } from '@/types'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const job = await prisma.jobPost.findUnique({
    where: { id },
  })

  if (!job || job.status !== 'open') {
    notFound()
  }

  const session = await auth()
  const isLoggedIn = !!session?.user
  const isTalent = session?.user?.role === 'talent'

  let hasApplied = false
  let userConnects = 0
  let isSaved = false
  if (session?.user?.id) {
    const existingApp = await prisma.application.findUnique({
      where: { jobPostId_applicantId: { jobPostId: id, applicantId: session.user.id } },
      select: { id: true },
    })
    hasApplied = !!existingApp
    if (isTalent) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { connects: true },
      })
      userConnects = user?.connects ?? 0
    }
    const saved = await prisma.savedJob.findUnique({
      where: { userId_jobPostId: { userId: session.user.id, jobPostId: id } },
      select: { id: true },
    })
    isSaved = !!saved
  }

  const typed: JobPost = {
    id: job.id,
    title: job.title,
    description: job.description,
    short_description: job.shortDescription,
    location: job.location,
    type: job.type as JobType,
    salary_range: job.salaryRange,
    skills: JSON.parse(job.skills) as string[],
    status: job.status as JobStatus,
    poster_id: job.posterId,
    poster_name: job.posterName,
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Talent Hub</Link>
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
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/jobs"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          &larr; Back to jobs
        </Link>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{typed.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {typed.location ?? 'Remote'}
                  {typed.salary_range ? ` · ${typed.salary_range}` : ''}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                {typed.type.replace('-', ' ')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {typed.skills && typed.skills.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {typed.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-medium">Description</h3>
              <div className="whitespace-pre-line text-sm text-muted-foreground">
                {typed.description}
              </div>
            </div>

            <div className="border-t pt-4 text-xs text-muted-foreground">
              Posted {new Date(typed.created_at).toLocaleDateString()}
              {typed.poster_name ? (
                <> by{' '}
                  <Link href={`/clients/${typed.poster_id}`} className="underline hover:text-foreground">
                    {typed.poster_name}
                  </Link>
                </>
              ) : ''}
            </div>

            {session?.user?.id ? (
              <div className="border-t pt-4">
                <div className="flex items-start gap-2">
                  {isTalent ? (
                    hasApplied ? (
                      <p className="text-sm text-muted-foreground flex-1">
                        You have applied to this position.{' '}
                        <Link href="/dashboard/applications" className="text-primary underline">
                          View application
                        </Link>
                      </p>
                    ) : (
                      <div className="flex-1">
                        <ApplyForm jobId={id} connects={userConnects} />
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground flex-1" />
                  )}
                  <SaveButton jobId={id} isSaved={isSaved} />
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Link href="/login" className={buttonVariants()}>
                    Sign in to apply
                  </Link>
                  <SaveButton jobId={id} isSaved={isSaved} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationCard } from '@/components/applications/application-card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const role = session.user.role
  const isTalent = role === 'talent'
  const isClient = role === 'client' || role === 'admin'

  let applications: unknown[] = []
  let total = 0

  if (isTalent) {
    const where = { applicantId: session.user.id }
    const [apps, count] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobPost: { select: { id: true, title: true, posterId: true, posterName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.application.count({ where }),
    ])
    applications = apps
    total = count
  } else if (isClient) {
    const where = { jobPost: { posterId: session.user.id } }
    const [apps, count] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          applicant: { select: { id: true, name: true, email: true } },
          jobPost: { select: { id: true, title: true, posterId: true, posterName: true } },
        },
        orderBy: [{ biddingConnects: 'desc' }, { createdAt: 'desc' }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.application.count({ where }),
    ])
    applications = apps
    total = count
  }

  const typedApps = applications as Array<{
    id: string
    jobPostId: string
    applicantId: string
    coverLetter: string | null
    status: string
    biddingConnects: number
    bidAmount: number | null
    bidType: string
    timeline: number | null
    approach: string | null
    createdAt: Date
    updatedAt: Date
    jobPost: { id: string; title: string; posterId: string; posterName: string | null }
    applicant?: { id: string; name: string | null; email: string }
  }>

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">
        {isTalent ? 'My Applications' : 'Applications Received'}
      </h1>

      {typedApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {isTalent ? 'No applications yet.' : 'No applications received yet.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTalent ? (
              <Link href="/jobs" className="text-primary underline">
                Browse open positions
              </Link>
            ) : (
              'Applications will appear here when talents apply to your jobs.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {typedApps.map((app) => (
            <ApplicationCard
              key={app.id}
              application={{
                id: app.id,
                jobPostId: app.jobPostId,
                applicantId: app.applicantId,
                coverLetter: app.coverLetter,
                status: app.status as any,
                biddingConnects: app.biddingConnects,
                bidAmount: app.bidAmount,
                bidType: app.bidType,
                timeline: app.timeline,
                approach: app.approach,
                createdAt: app.createdAt.toISOString(),
                updatedAt: app.updatedAt.toISOString(),
                jobPost: app.jobPost,
                applicant: app.applicant,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t pt-4 text-sm">
          <p className="text-muted-foreground">
            Page {currentPage} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/dashboard/applications?page=${currentPage - 1}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/applications?page=${currentPage + 1}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

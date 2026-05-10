import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationCard } from '@/components/applications/application-card'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role
  const isTalent = role === 'talent'
  const isClient = role === 'client' || role === 'admin'

  let applications: unknown[] = []

  if (isTalent) {
    const apps = await prisma.application.findMany({
      where: { applicantId: session.user.id },
      include: {
        jobPost: { select: { id: true, title: true, posterId: true, posterName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    applications = apps
  } else if (isClient) {
    const apps = await prisma.application.findMany({
      where: { jobPost: { posterId: session.user.id } },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        jobPost: { select: { id: true, title: true, posterId: true, posterName: true } },
      },
      orderBy: [{ biddingConnects: 'desc' }, { createdAt: 'desc' }],
    })
    applications = apps
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
    </>
  )
}

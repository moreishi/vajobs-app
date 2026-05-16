import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getJobProposals } from '@/actions/proposals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/components/applications/application-status-badge'
import { AcceptProposalButton } from '@/components/proposals/accept-proposal-button'
import { RejectProposalButton } from '@/components/proposals/reject-proposal-button'
import type { ApplicationStatus } from '@/types'

export const dynamic = 'force-dynamic'

export default async function JobProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const job = await prisma.jobPost.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, posterId: true },
  })
  if (!job) redirect('/dashboard')
  if (job.posterId !== session.user.id && session.user.role !== 'admin') redirect('/dashboard')

  const result = await getJobProposals(id)
  const proposals = result.success ? result.data : []
  const totalProposals = proposals.length
  const pendingReview = proposals.filter((p) => p.status === 'pending' || p.status === 'reviewed').length

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalProposals} proposal{totalProposals !== 1 ? 's' : ''}
            {pendingReview > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                &middot; {pendingReview} pending review
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View Job
          </Link>
          <Link
            href={`/dashboard/jobs/${job.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Edit Job
          </Link>
        </div>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No proposals received yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Proposals will appear here when talents apply to this job.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const canAct =
              proposal.status !== 'accepted' &&
              proposal.status !== 'rejected' &&
              proposal.status !== 'withdrawn'

            return (
              <Card key={proposal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {proposal.applicantName || proposal.applicantEmail}
                        </CardTitle>
                        <ApplicationStatusBadge status={proposal.status as ApplicationStatus} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{proposal.applicantEmail}</p>
                    </div>
                    <Link
                      href={`/dashboard/applications/${proposal.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      Details
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Bid Details */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {proposal.bidAmount && (
                      <div>
                        <span className="text-xs text-muted-foreground">Bid</span>
                        <p className="font-medium">
                          ${proposal.bidAmount.toFixed(2)}
                          {proposal.bidType === 'hourly' ? '/hr' : ' fixed'}
                        </p>
                      </div>
                    )}
                    {proposal.timeline && (
                      <div>
                        <span className="text-xs text-muted-foreground">Timeline</span>
                        <p className="font-medium">{proposal.timeline} days</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">Connects</span>
                      <p className="font-medium">{proposal.biddingConnects}c</p>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {proposal.coverLetter && (
                    <div>
                      <span className="text-xs text-muted-foreground">Cover Letter</span>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {proposal.coverLetter}
                      </p>
                    </div>
                  )}

                  {/* Approach */}
                  {proposal.approach && (
                    <div>
                      <span className="text-xs text-muted-foreground">Approach</span>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                        {proposal.approach}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {canAct && (
                    <div className="flex flex-wrap items-center gap-2">
                      <AcceptProposalButton applicationId={proposal.id} />
                      <RejectProposalButton applicationId={proposal.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

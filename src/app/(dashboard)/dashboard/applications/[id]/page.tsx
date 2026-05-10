import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getApplicationById } from '@/actions/applications'
import { getAssessmentAttempt, getAssessments } from '@/actions/assessments'
import { AssessmentTaker } from '@/components/assessments/assessment-taker'
import { AssessmentResults } from '@/components/assessments/assessment-results'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/components/applications/application-status-badge'
import { StatusUpdateForm } from '@/components/applications/status-update-form'
import { WithdrawButton } from '@/components/applications/withdraw-button'
import { ChatMessages } from '@/components/chat/chat-messages'
import { InterviewDetails } from '@/components/interviews/interview-details'
import { InterviewForm } from '@/components/interviews/interview-form'
import { ReviewForm } from '@/components/reviews/review-form'
import { AcceptProposalButton } from '@/components/proposals/accept-proposal-button'
import { EditProposalForm } from '@/components/proposals/edit-proposal-form'
import type { ApplicationStatus } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const application = await getApplicationById(id)
  if (!application) notFound()

  const isApplicant = application.applicantId === session.user.id
  const isPoster = application.jobPost.posterId === session.user.id

  const attempt = await getAssessmentAttempt(id)
  const assessments = await getAssessments(application.jobPost.id)
  const assessment = assessments[0] ?? null

  return (
    <>
      <Link href="/dashboard/applications" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Applications
      </Link>
      <div className="mx-auto max-w-3xl space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">{application.jobPost.title}</CardTitle>
                  {isPoster && application.applicant && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Applicant: {application.applicant.name || application.applicant.email}
                    </p>
                  )}
                </div>
                <ApplicationStatusBadge status={application.status as ApplicationStatus} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Applied {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {application.coverLetter}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Proposal Details (both views) */}
          {(application as any).bidAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proposal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Bid Amount</span>
                    <p className="font-medium">${(application as any).bidAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Type</span>
                    <p className="font-medium">{(application as any).bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}</p>
                  </div>
                  {(application as any).timeline && (
                    <div>
                      <span className="text-xs text-muted-foreground">Timeline</span>
                      <p className="font-medium">{(application as any).timeline} days</p>
                    </div>
                  )}
                </div>
                {(application as any).approach && (
                  <div>
                    <span className="text-xs text-muted-foreground">Approach</span>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{(application as any).approach}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {isPoster && application.status !== 'accepted' && application.status !== 'rejected' && (
                    <AcceptProposalButton applicationId={application.id} />
                  )}
                  {isApplicant && application.status !== 'accepted' && application.status !== 'rejected' && application.status !== 'withdrawn' && (
                    <EditProposalForm
                      applicationId={application.id}
                      initialBidAmount={(application as any).bidAmount}
                      initialBidType={(application as any).bidType}
                      initialTimeline={(application as any).timeline}
                      initialApproach={(application as any).approach}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessment */}
          {assessment && attempt ? (
            <AssessmentResults attempt={attempt} isClient={isPoster && !isApplicant} />
          ) : assessment && isApplicant && !isPoster ? (
            <AssessmentTaker assessment={assessment} applicationId={id} />
          ) : isPoster && !isApplicant && !attempt ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No assessment submitted yet.</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Status Update (Client only) */}
          {isPoster && !isApplicant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusUpdateForm
                  applicationId={application.id}
                  currentStatus={application.status as ApplicationStatus}
                />
              </CardContent>
            </Card>
          )}

          {/* Review (Client only, after accepted) */}
          {isPoster && !isApplicant && application.status === 'accepted' && (
            <ReviewForm applicationId={application.id} />
          )}

          {/* Withdraw (Talent only) */}
          {isApplicant && !isPoster && application.status !== 'accepted' && application.status !== 'rejected' && application.status !== 'withdrawn' && (
            <Card>
              <CardContent className="pt-6">
                <WithdrawButton applicationId={application.id} />
              </CardContent>
            </Card>
          )}

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatMessages
                applicationId={application.id}
                currentUserId={session.user.id}
                initialMessages={application.conversation?.messages || []}
              />
            </CardContent>
          </Card>

          {/* Interview */}
          {application.interview ? (
            <InterviewDetails
              interview={application.interview}
              isClient={isPoster && !isApplicant}
            />
          ) : isPoster && !isApplicant && (application.status === 'interview' || application.status === 'pending' || application.status === 'reviewed') ? (
            <InterviewForm applicationId={application.id} />
          ) : null}
        </div>
    </>
  )
}

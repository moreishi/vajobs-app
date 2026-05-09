import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getApplicationById } from '@/actions/applications'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/components/applications/application-status-badge'
import { StatusUpdateForm } from '@/components/applications/status-update-form'
import { WithdrawButton } from '@/components/applications/withdraw-button'
import { MessageBubble } from '@/components/messages/message-bubble'
import { MessageForm } from '@/components/messages/message-form'
import { InterviewDetails } from '@/components/interviews/interview-details'
import { InterviewForm } from '@/components/interviews/interview-form'
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
            <CardContent className="space-y-4">
              {application.conversation && application.conversation.messages && application.conversation.messages.length > 0 ? (
                <div className="space-y-3">
                  {application.conversation.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === session.user.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet. Send a message below.
                </p>
              )}

              <MessageForm applicationId={application.id} />
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

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEngagementById } from '@/actions/engagements'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { EndEngagementButton } from '@/components/engagements/end-engagement-button'

export const dynamic = 'force-dynamic'

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const engagement = await getEngagementById(id)
  if (!engagement) notFound()

  const isTalent = engagement.talentId === session.user.id
  const isClient = engagement.clientId === session.user.id

  return (
    <>
      <Link href="/dashboard/engagements" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Engagements
      </Link>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-xl">{engagement.jobPost.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isTalent
                    ? `Client: ${engagement.client.name || engagement.client.email}`
                    : `Talent: ${engagement.talent.name || engagement.talent.email}`
                  }
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  engagement.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {engagement.status === 'active' ? 'Active' : 'Ended'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started</span>
                <p className="font-medium">{new Date(engagement.startDate).toLocaleDateString()}</p>
              </div>
              {engagement.endDate && (
                <div>
                  <span className="text-muted-foreground">Ended</span>
                  <p className="font-medium">{new Date(engagement.endDate).toLocaleDateString()}</p>
                </div>
              )}
              {engagement.rate && (
                <div>
                  <span className="text-muted-foreground">Rate</span>
                  <p className="font-medium">${engagement.rate.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {engagement.jobPost.description && (
              <p className="text-muted-foreground">{engagement.jobPost.description.slice(0, 300)}...</p>
            )}
            <div className="flex gap-2">
              <Link
                href={`/jobs/${engagement.jobPost.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                View Job Post
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Link
              href={`/dashboard/applications/${engagement.application.id}`}
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              View Messages
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Communicate with {isTalent ? 'your client' : 'your talent'} about this engagement.
            </p>
          </CardContent>
        </Card>

        {engagement.status === 'ended' && isClient && !engagement.application.review && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/applications/${engagement.application.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Review Talent
              </Link>
            </CardContent>
          </Card>
        )}

        {engagement.status === 'active' && isClient && (
          <EndEngagementButton engagementId={engagement.id} />
        )}
      </div>
    </>
  )
}

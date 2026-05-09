import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UnsaveButton } from '@/components/jobs/unsave-button'

export const dynamic = 'force-dynamic'

export default async function SavedJobsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { getSavedJobs } = await import('@/actions/saved-jobs')
  const savedJobs = await getSavedJobs()

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Saved Jobs</h1>

      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg text-muted-foreground">No saved jobs yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/jobs" className="text-primary underline">Browse jobs</Link> and save the ones you&apos;re interested in.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map(({ id, jobPost }) => (
            <Card key={id}>
              <CardContent className="p-6">
                <Link href={`/jobs/${jobPost.id}`} className="block">
                  <h3 className="font-semibold hover:underline">{jobPost.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{jobPost.type?.replace('-', ' ')}{jobPost.location ? ` · ${jobPost.location}` : ''}</p>
                  {jobPost.shortDescription && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{jobPost.shortDescription}</p>
                  )}
                </Link>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {jobPost.salaryRange && <span>{jobPost.salaryRange}</span>}
                  </div>
                  <UnsaveButton jobId={jobPost.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

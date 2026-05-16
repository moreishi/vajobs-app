import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { JobStatusToggle } from '@/components/jobs/job-status-toggle'
import { deleteJob } from '@/actions/jobs'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      posterName: true,
      type: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  })

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Manage Jobs</h1>

      <Card>
        <CardHeader><CardTitle>All Jobs ({jobs.length})</CardTitle></CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[500px] divide-y">
                <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
                <span className="col-span-2">Title</span>
                <span>Poster</span>
                <span>Apps</span>
                <span></span>
                <span></span>
              </div>
              {jobs.map((job) => (
                <div key={job.id} className="grid grid-cols-6 gap-4 py-3 items-center">
                  <div className="col-span-2 min-w-0">
                    <Link href={`/jobs/${job.id}`} className="truncate text-sm font-medium hover:underline block">
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {job.type} &middot; {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div><span className="text-sm text-muted-foreground">{job.posterName || 'Unknown'}</span></div>
                  <div><span className="text-sm">{job._count.applications}</span></div>
                  <div>
                    <JobStatusToggle jobId={job.id} currentStatus={job.status as 'open' | 'closed'} />
                  </div>
                  <div>
                    <form
                      action={async () => {
                        'use server'
                        await deleteJob(job.id)
                      }}
                    >
                      <button type="submit" className="text-xs text-destructive hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No jobs posted yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

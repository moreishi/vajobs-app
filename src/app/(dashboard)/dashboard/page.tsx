import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { Role } from '@/types'

const roleConfig: Record<Role, { label: string; className: string }> = {
  guest: { label: 'Guest', className: 'bg-muted text-muted-foreground' },
  talent: { label: 'Talent', className: 'bg-secondary text-secondary-foreground' },
  client: { label: 'Client', className: 'bg-primary text-primary-foreground' },
  admin: { label: 'Admin', className: 'bg-destructive text-destructive-foreground' },
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) redirect('/login')

  const { user } = session
  const role = (user.role as Role) || 'guest'
  const userId = user.id!

  let connects = 0
  if (role === 'talent') {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { connects: true },
    })
    connects = u?.connects ?? 0
  }

  // Client-specific data
  let myJobPosts: { id: string; title: string; status: string; _count: { applications: number } }[] = []
  let hiredTalents: { id: string; applicant: { name: string | null; email: string }; jobPost: { title: string } }[] = []
  if (role === 'client' || role === 'admin') {
    myJobPosts = await prisma.jobPost.findMany({
      where: { posterId: userId },
      select: { id: true, title: true, status: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const accepted = await prisma.application.findMany({
      where: { jobPost: { posterId: userId }, status: 'accepted' },
      select: { id: true, applicant: { select: { name: true, email: true } }, jobPost: { select: { title: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    hiredTalents = accepted
  }

  return (
    <>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>You are signed in as <strong>{user.email}</strong>.</p>
            <p>
              Role:{' '}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleConfig[role].className}`}>
                {roleConfig[role].label}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
            {role === 'talent' && (
              <p className="text-sm">
                Connects balance: <span className="font-bold">{connects}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {(role === 'talent' || role === 'client' || role === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {role === 'talent' && (
                <>
                  <Link href="/dashboard/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Edit Profile
                  </Link>
                  <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    My Applications
                  </Link>
                </>
              )}
              {(role === 'client' || role === 'admin') && (
                <>
                  <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Applications Received
                  </Link>
                  <Link href="/dashboard/jobs/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Post a Job
                  </Link>
                  <Link href="/talents" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Browse Talents
                  </Link>
                </>
              )}
              <Link href="/dashboard/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Account Settings
              </Link>
              <Link href="/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Browse Jobs
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {(role === 'client' || role === 'admin') && myJobPosts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>My Job Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {myJobPosts.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {job.status} &middot; {job._count.applications} application{job._count.applications !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href="/dashboard/applications" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    View Applications
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(role === 'client' || role === 'admin') && hiredTalents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Hired Talents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {hiredTalents.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{app.applicant.name || app.applicant.email}</p>
                    <p className="text-sm text-muted-foreground">{app.jobPost.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ApplicationStatusBadge } from '@/components/applications/application-status-badge'
import { JobStatusToggle } from '@/components/jobs/job-status-toggle'
import { ReferralCard } from '@/components/dashboard/referral-card'
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

  // Redirect to onboarding if profile not set up
  if (role === 'guest') {
    redirect('/dashboard/choose-role')
  } else if (role === 'talent') {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { headline: true, bio: true, skills: true },
    })
    if (!profile?.headline || !profile?.bio) {
      redirect('/dashboard/onboarding')
    }
  } else if (role === 'client') {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { company: true },
    })
    if (!clientProfile?.company) {
      redirect('/dashboard/onboarding')
    }
  }

  if (role === 'talent') {
    const [u, pendingApps, interviews, acceptedApps, referralEarnings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { connects: true, referralCode: true },
      }),
      prisma.application.count({
        where: { applicantId: userId, status: { in: ['pending', 'reviewed'] } },
      }),
      prisma.application.count({
        where: { applicantId: userId, status: 'interview' },
      }),
      prisma.application.count({
        where: { applicantId: userId, status: 'accepted' },
      }),
      prisma.referralReward.aggregate({
        where: { referrerId: userId },
        _sum: { amount: true },
      }),
    ])
    const connects = u?.connects ?? 0
    const referralCode = u?.referralCode
    const totalReferralEarnings = referralEarnings._sum.amount ?? 0

    return (
      <>
        <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Connects Balance</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{connects}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Applications</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{pendingApps}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{interviews}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{acceptedApps}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-600 dark:text-green-400">+{totalReferralEarnings}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/messages" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Messages</Link>
            <Link href="/dashboard/connects" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Buy Connects</Link>
            <Link href="/dashboard/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Edit Profile</Link>
            <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>My Applications</Link>
            <Link href="/dashboard/engagements" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Engagements</Link>
            <Link href="/dashboard/saved-jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Saved Jobs</Link>
            <Link href="/dashboard/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Account Settings</Link>
            <Link href="/dashboard/referrals" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Referrals</Link>
            <Link href="/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Browse Jobs</Link>
            <Link href="/dashboard/saved-searches" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Saved Searches</Link>
            <Link href="/dashboard/va-subscription" className={buttonVariants({ variant: 'outline', size: 'sm' })}>VA Membership</Link>
          </CardContent>
        </Card>

        {referralCode && (
          <div className="mb-8">
            <ReferralCard
              referralCode={referralCode}
              referralEarnings={totalReferralEarnings}
              baseUrl={process.env.NEXT_PUBLIC_URL || process.env.AUTH_URL || 'http://localhost:3000'}
            />
          </div>
        )}
      </>
    )
  }

  // ── Client / Admin dashboard ──
  const [jobPosts, totalAppsResult, pendingReview, recentApps, hired, interviewsUpcoming, connectsEarned, activeSubscription, currentUser, referralEarnings] = await Promise.all([
    prisma.jobPost.findMany({
      where: { posterId: userId },
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.count({
      where: { jobPost: { posterId: userId } },
    }),
    prisma.application.count({
      where: { jobPost: { posterId: userId }, status: 'pending' },
    }),
    prisma.application.findMany({
      where: { jobPost: { posterId: userId } },
      select: {
        id: true,
        status: true,
        biddingConnects: true,
        createdAt: true,
        applicant: { select: { id: true, name: true, email: true } },
        jobPost: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.application.findMany({
      where: { jobPost: { posterId: userId }, status: 'accepted' },
      select: {
        id: true,
        applicant: { select: { name: true, email: true } },
        jobPost: { select: { title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.interview.findMany({
      where: {
        application: { jobPost: { posterId: userId } },
        status: 'scheduled',
        scheduledAt: { gte: new Date() },
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        meetingLink: true,
        application: {
          select: {
            id: true,
            applicant: { select: { name: true, email: true } },
            jobPost: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.application.aggregate({
      where: { jobPost: { posterId: userId } },
      _sum: { biddingConnects: true },
    }),
    prisma.clientSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.referralReward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true },
    }),
  ])
  const clientReferralCode = currentUser?.referralCode
  const totalClientReferralEarnings = referralEarnings._sum.amount ?? 0

  const activeJobs = jobPosts.filter(j => j.status === 'open').length
  const totalConnectsEarned = connectsEarned._sum.biddingConnects ?? 0

  return (
    <>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{activeJobs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalAppsResult}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{pendingReview}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Connects Received</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalConnectsEarned}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600 dark:text-green-400">+{totalClientReferralEarnings}</p></CardContent>
        </Card>
      </div>

      {/* Subscription status for clients */}
      {role !== 'admin' && activeSubscription && (
        <Card className="mb-8">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Membership</p>
              <p className="font-medium">{activeSubscription.plan.name} Plan</p>
              <p className="text-xs text-muted-foreground">
                Renews {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <Link href="/dashboard/subscriptions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Manage
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Links + Upcoming Interviews */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/messages" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Messages</Link>
            <Link href="/dashboard/jobs/new" className={buttonVariants({ size: 'sm' })}>Post a Job</Link>
            <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>View Applications</Link>
            <Link href="/talents" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Browse Talents</Link>
            <Link href="/dashboard/client-profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Edit Profile</Link>
            <Link href="/dashboard/saved-jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Saved Jobs</Link>
            <Link href="/dashboard/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Account Settings</Link>
            <Link href="/dashboard/referrals" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Referrals</Link>
            <Link href="/dashboard/subscriptions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Membership</Link>
            <Link href="/dashboard/saved-searches" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Saved Searches</Link>
            {role === 'admin' && (
              <Link href="/dashboard/admin" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Admin Dashboard</Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Interviews</CardTitle></CardHeader>
          <CardContent>
            {interviewsUpcoming.length > 0 ? (
              <div className="divide-y">
                {interviewsUpcoming.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{iv.application.applicant.name || iv.application.applicant.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(iv.scheduledAt).toLocaleDateString()} at{' '}
                        {new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {iv.duration ? ` · ${iv.duration}min` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/applications/${iv.application.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming interviews.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Recent Applications</CardTitle></CardHeader>
        <CardContent>
          {recentApps.length > 0 ? (
            <div className="divide-y">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.applicant.name || app.applicant.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.jobPost.title}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <ApplicationStatusBadge status={app.status as any} />
                    <span className="text-xs text-muted-foreground">{app.biddingConnects}c</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No applications yet.</p>
          )}
        </CardContent>
      </Card>

      {/* My Job Posts */}
      <Card className="mb-6">
        <CardHeader><CardTitle>My Job Posts</CardTitle></CardHeader>
        <CardContent>
          {jobPosts.length > 0 ? (
            <div className="divide-y">
              {jobPosts.map((job) => {
                const isOpen = job.status === 'open'
                return (
                  <div key={job.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        <span className={isOpen ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>{job.status}</span>
                        {' · '}
                        {job._count.applications} application{job._count.applications !== 1 ? 's' : ''}
                        {' · '}
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/dashboard/applications?jobId=${job.id}`}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                      >
                        Apps
                      </Link>
                      <Link
                        href={`/dashboard/jobs/${job.id}/edit`}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                      >
                        Edit
                      </Link>
                      <JobStatusToggle jobId={job.id} currentStatus={job.status as 'open' | 'closed'} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">You haven&apos;t posted any jobs yet.</p>
              <Link href="/dashboard/jobs/new" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3' })}>
                Post Your First Job
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hired Talents */}
      {hired.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hired Talents</CardTitle>
              <Link href="/dashboard/engagements" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {hired.map((app) => (
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

      {clientReferralCode && (
        <div className="mb-8">
          <ReferralCard
            referralCode={clientReferralCode}
            referralEarnings={totalClientReferralEarnings}
            baseUrl={process.env.NEXT_PUBLIC_URL || process.env.AUTH_URL || 'http://localhost:3000'}
          />
        </div>
      )}
    </>
  )
}

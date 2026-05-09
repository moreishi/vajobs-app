import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { BarChart } from '@/components/ui/bar-chart'
import { LineChart } from '@/components/ui/line-chart'
import { PieChart } from '@/components/ui/pie-chart'
import { AdminExportButtons } from './admin-export-buttons'

export const dynamic = 'force-dynamic'

function lastNDays(n: number): Date[] {
  const days: Date[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

function lastNMonths(n: number): Date[] {
  const months: Date[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    months.push(d)
  }
  return months
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    totalUsers,
    roleCounts,
    totalJobs,
    statusCounts,
    totalApps,
    appStatusCounts,
    totalConnectsAgg,
    recentUsers,
    signupsLast30,
    appsLast30,
    connectTxSummary,
    topJobs,
    signupsLast6Months,
    engagements,
    applicationsAll,
    allConnectTx,
    connectTxLast30,
    allJobs,
    totalTalents,
    totalClients,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.jobPost.count(),
    prisma.jobPost.groupBy({ by: ['status'], _count: true }),
    prisma.application.count(),
    prisma.application.groupBy({ by: ['status'], _count: true }),
    prisma.user.aggregate({ _sum: { connects: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.application.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.connectTransaction.groupBy({
      by: ['type'],
      _count: true,
      _sum: { amount: true },
    }),
    prisma.jobPost.findMany({
      take: 5,
      orderBy: { applications: { _count: 'desc' } },
      select: { id: true, title: true, _count: { select: { applications: true } } },
      where: { applications: { some: {} } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, role: true },
    }),
    prisma.engagement.findMany({
      select: { id: true, status: true, startDate: true, endDate: true, createdAt: true },
    }),
    prisma.application.findMany({
      where: { status: { in: ['accepted', 'rejected', 'withdrawn'] } },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.connectTransaction.findMany({
      select: { id: true, amount: true, type: true, createdAt: true },
    }),
    prisma.connectTransaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, type: 'purchase' },
      select: { amount: true },
    }),
    prisma.jobPost.findMany({
      select: { id: true, skills: true, type: true, status: true, salaryRange: true },
      where: { status: 'open' },
    }),
    prisma.user.count({ where: { role: 'talent' } }),
    prisma.user.count({ where: { role: 'client' } }),
  ])

  const roleMap: Record<string, number> = {}
  for (const r of roleCounts) roleMap[r.role] = r._count

  const statusMap: Record<string, number> = {}
  for (const s of statusCounts) statusMap[s.status] = s._count

  const appStatusMap: Record<string, number> = {}
  for (const s of appStatusCounts) appStatusMap[s.status] = s._count

  // Daily signups (last 14 days)
  const last14 = lastNDays(14)
  const dailySignups = last14.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    return {
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      value: signupsLast30.filter((u) => {
        const c = new Date(u.createdAt)
        return c >= day && c < next
      }).length,
    }
  })

  // Daily applications (last 14 days)
  const dailyApps = last14.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    return {
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      value: appsLast30.filter((a) => {
        const c = new Date(a.createdAt)
        return c >= day && c < next
      }).length,
    }
  })

  // Monthly signups (last 6 months)
  const last6Months = lastNMonths(6)
  const monthlySignups = last6Months.map((monthStart) => {
    const nextMonth = new Date(monthStart)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return {
      label: monthStart.toLocaleDateString(undefined, { month: 'short' }),
      value: signupsLast6Months.filter((u) => {
        const c = new Date(u.createdAt)
        return c >= monthStart && c < nextMonth
      }).length,
    }
  })

  // Monthly connects revenue (last 6 months)
  const monthlyRevenue = last6Months.map((monthStart) => {
    const nextMonth = new Date(monthStart)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const amount = allConnectTx
      .filter((tx) => tx.type === 'purchase')
      .filter((tx) => {
        const c = new Date(tx.createdAt)
        return c >= monthStart && c < nextMonth
      })
      .reduce((sum, tx) => sum + tx.amount, 0)
    return {
      label: monthStart.toLocaleDateString(undefined, { month: 'short' }),
      value: amount,
    }
  })

  // Connects summary
  const totalConnectsPurchased = connectTxSummary.find((t) => t.type === 'purchase')
  const totalConnectsSpent = connectTxSummary.find((t) => t.type === 'application')
  const totalTx = connectTxSummary.reduce((sum, t) => sum + t._count, 0)

  // Connects revenue last 30 days
  const revenueLast30 = connectTxLast30.reduce((sum, tx) => sum + tx.amount, 0)

  // Engagement analytics
  const totalEngagements = engagements.length
  const activeEngagements = engagements.filter((e) => e.status === 'active').length
  const endedEngagements = engagements.filter((e) => e.status === 'ended').length
  const engagementsWithDuration = engagements
    .filter((e) => e.endDate)
    .map((e) => ({
      durationMs: new Date(e.endDate!).getTime() - new Date(e.startDate).getTime(),
    }))
  const avgEngagementDays = engagementsWithDuration.length > 0
    ? Math.round(engagementsWithDuration.reduce((sum, e) => sum + e.durationMs, 0) / engagementsWithDuration.length / 86400000)
    : 0

  // Hire rate
  const resolvedApplications = applicationsAll.length
  const acceptedApplications = applicationsAll.filter((a) => a.status === 'accepted').length
  const hireRate = resolvedApplications > 0
    ? Math.round((acceptedApplications / resolvedApplications) * 100)
    : 0

  // Role distribution
  const roleDistribution = [
    { label: 'Talent', value: roleMap['talent'] ?? 0 },
    { label: 'Client', value: roleMap['client'] ?? 0 },
    { label: 'Admin', value: roleMap['admin'] ?? 0 },
    { label: 'Guest', value: roleMap['guest'] ?? 0 },
  ].filter((r) => r.value > 0)

  // Top skills
  const skillCounts: Record<string, number> = {}
  for (const job of allJobs) {
    const skills = JSON.parse(job.skills) as string[]
    for (const skill of skills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1
    }
  }
  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }))

  // MoM growth
  const thisMonth = last6Months[last6Months.length - 1]
  const lastMonth = last6Months[last6Months.length - 2]
  const thisMonthSignups = thisMonth
    ? signupsLast6Months.filter((u) => {
        const c = new Date(u.createdAt)
        const next = new Date(thisMonth)
        next.setMonth(next.getMonth() + 1)
        return c >= thisMonth && c < next
      }).length
    : 0
  const lastMonthSignups = lastMonth
    ? signupsLast6Months.filter((u) => {
        const c = new Date(u.createdAt)
        const next = new Date(lastMonth)
        next.setMonth(next.getMonth() + 1)
        return c >= lastMonth && c < next
      }).length
    : 0
  const signupGrowth = lastMonthSignups > 0
    ? Math.round(((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100)
    : 0

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <AdminExportButtons />
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            &larr; Dashboard
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalTalents} talent &middot; {totalClients} client &middot; {(roleMap['admin'] ?? 0)} admin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Job Posts</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalJobs}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(statusMap['open'] ?? 0)} open &middot; {(statusMap['closed'] ?? 0)} closed &middot; {(statusMap['draft'] ?? 0)} draft
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalApps}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(appStatusMap['pending'] ?? 0)} pending &middot; {(appStatusMap['accepted'] ?? 0)} accepted &middot; {hireRate}% hire rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Engagements</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEngagements}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeEngagements} active &middot; {endedEngagements} ended &middot; &oslash;{avgEngagementDays}d
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth metrics row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Signups (30d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{signupsLast30.length}</p>
            <p className={cn('mt-1 text-xs', signupGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
              {signupGrowth >= 0 ? '↑' : '↓'} {Math.abs(signupGrowth)}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applications (30d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{appsLast30.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Connects Revenue (30d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{revenueLast30}</p>
            <p className="mt-1 text-xs text-muted-foreground">connects purchased</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hire Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hireRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {acceptedApplications}/{resolvedApplications} accepted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Monthly Signup Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">User Growth (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <LineChart data={monthlySignups} height={100} />
          </CardContent>
        </Card>

        {/* Daily Signups */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Signups (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={dailySignups} height={100} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Daily Applications */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Applications (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={dailyApps} height={100} />
          </CardContent>
        </Card>

        {/* Connects Revenue Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Connects Purchased (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <LineChart data={monthlyRevenue} height={100} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Role Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">User Role Distribution</CardTitle></CardHeader>
          <CardContent>
            <PieChart data={roleDistribution} size={120} />
          </CardContent>
        </Card>

        {/* Connects Economy */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Connects Economy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Total purchased</span>
              <span className="font-semibold">{totalConnectsPurchased?._sum.amount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Total spent on apps</span>
              <span className="font-semibold">{totalConnectsSpent?._sum.amount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">In circulation</span>
              <span className="font-semibold">{(totalConnectsAgg._sum.connects ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total transactions</span>
              <span className="font-semibold">{totalTx}</span>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Analytics */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Engagement Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="font-semibold">{activeEngagements}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Ended</span>
              <span className="font-semibold">{endedEngagements}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Avg duration</span>
              <span className="font-semibold">{avgEngagementDays} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active engagements</span>
              <span className="font-semibold">{activeEngagements}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Top Skills */}
        {topSkills.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Top Skills in Demand</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSkills.map((item, i) => {
                  const maxCount = topSkills[0].count
                  const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                  return (
                    <div key={item.skill} className="flex items-center gap-3">
                      <span className="w-6 text-right text-xs text-muted-foreground">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm">{item.skill}</span>
                          <span className="text-xs text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Jobs + Quick Actions */}
        <div className="space-y-6">
          {topJobs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Most Applied Jobs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topJobs.map((job, i) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 truncate">
                        <Link href={`/dashboard/admin/jobs`} className="text-sm hover:underline">
                          {i + 1}. {job.title}
                        </Link>
                      </div>
                      <span className="ml-2 shrink-0 text-sm font-medium">{job._count.applications}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Admin Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/dashboard/admin/users" className={buttonVariants({ size: 'sm' })}>Manage Users</Link>
              <Link href="/dashboard/admin/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Manage Jobs</Link>
              <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Applications</Link>
              <Link href="/dashboard/admin/payments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Payment Settings</Link>
              <Link href="/setup" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Seed Data</Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Recent Users</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name || u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.role} &middot; {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}



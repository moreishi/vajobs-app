import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { BarChart } from '@/components/ui/bar-chart'

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

export default async function AdminDashboardPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

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

  // Connects summary
  const totalConnectsPurchased = connectTxSummary.find((t) => t.type === 'purchase')
  const totalConnectsSpent = connectTxSummary.find((t) => t.type === 'application')
  const totalTx = connectTxSummary.reduce((sum, t) => sum + t._count, 0)

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          &larr; Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(roleMap['talent'] ?? 0)} talent &middot; {(roleMap['client'] ?? 0)} client &middot; {(roleMap['admin'] ?? 0)} admin
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
              {(appStatusMap['pending'] ?? 0)} pending &middot; {(appStatusMap['accepted'] ?? 0)} accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Connects</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalConnectsAgg._sum.connects ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalTx} transactions &middot; {totalConnectsPurchased?._sum.amount ?? 0} purchased
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Daily Signups Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Signups (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={dailySignups} height={100} />
          </CardContent>
        </Card>

        {/* Daily Applications Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Applications (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={dailyApps} height={100} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Connects Economy */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Connects Economy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Total purchased</span>
              <span className="font-semibold">{totalConnectsPurchased?._sum.amount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Total spent on applications</span>
              <span className="font-semibold">{totalConnectsSpent?._sum.amount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total transactions</span>
              <span className="font-semibold">{totalTx}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Jobs */}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Admin Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/users" className={buttonVariants({ size: 'sm' })}>Manage Users</Link>
            <Link href="/dashboard/admin/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Manage Jobs</Link>
            <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Applications</Link>
            <Link href="/setup" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Seed Data</Link>
          </CardContent>
        </Card>
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

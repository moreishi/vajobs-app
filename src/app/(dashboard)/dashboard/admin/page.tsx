import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const [
    totalUsers,
    roleCounts,
    totalJobs,
    statusCounts,
    totalApps,
    appStatusCounts,
    totalConnects,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.jobPost.count(),
    prisma.jobPost.groupBy({ by: ['status'], _count: true }),
    prisma.application.count(),
    prisma.application.groupBy({ by: ['status'], _count: true }),
    prisma.user.aggregate({ _sum: { connects: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ])

  const roleMap: Record<string, number> = {}
  for (const r of roleCounts) roleMap[r.role] = r._count

  const statusMap: Record<string, number> = {}
  for (const s of statusCounts) statusMap[s.status] = s._count

  const appStatusMap: Record<string, number> = {}
  for (const s of appStatusCounts) appStatusMap[s.status] = s._count

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          &larr; Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(roleMap['talent'] ?? 0)} talent &middot; {(roleMap['client'] ?? 0)} client &middot; {(roleMap['admin'] ?? 0)} admin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Job Posts</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalJobs}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(statusMap['open'] ?? 0)} open &middot; {(statusMap['closed'] ?? 0)} closed &middot; {(statusMap['draft'] ?? 0)} draft
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalApps}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(appStatusMap['pending'] ?? 0)} pending &middot; {(appStatusMap['accepted'] ?? 0)} accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Connects</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalConnects._sum.connects ?? 0}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/users" className={buttonVariants({ size: 'sm' })}>Manage Users</Link>
            <Link href="/dashboard/admin/jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Manage Jobs</Link>
            <Link href="/dashboard/applications" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Applications</Link>
            <Link href="/setup" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Seed Data</Link>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
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
      </div>
    </>
  )
}

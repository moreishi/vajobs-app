import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AdminReferralsPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') redirect('/dashboard')

  const [
    totalRewards,
    totalReferrers,
    totalReferred,
    totalConnectsAwarded,
    recentRewards,
    topReferrers,
    dailySignups,
  ] = await Promise.all([
    prisma.referralReward.count(),
    prisma.user.count({ where: { referralCode: { not: null } } }),
    prisma.user.count({ where: { referredById: { not: null } } }),
    prisma.referralReward.aggregate({ _sum: { amount: true } }),
    prisma.referralReward.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { name: true, email: true } },
        referee: { select: { name: true, email: true } },
      },
    }),
    prisma.referralReward.groupBy({
      by: ['referrerId'],
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    }),
    prisma.user.groupBy({
      by: ['createdAt'],
      where: { referredById: { not: null } },
      _count: true,
    }),
  ])

  // Resolve top referrers
  const referrerIds = topReferrers.map(r => r.referrerId)
  const referrers = referrerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: referrerIds } },
        select: { id: true, name: true, email: true },
      })
    : []
  const referrerMap = new Map(referrers.map(r => [r.id, r]))

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Referral Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewards Granted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalRewards}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Users with Codes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalReferrers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Referred Signups</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalReferred}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Connects Awarded</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600 dark:text-green-400">+{totalConnectsAwarded._sum.amount ?? 0}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>Top Referrers</CardTitle></CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No referral rewards yet.</p>
            ) : (
              <div className="divide-y">
                {topReferrers.map((r, i) => {
                  const u = referrerMap.get(r.referrerId)
                  return (
                    <div key={r.referrerId} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u?.name || u?.email || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{r._count} referral{r._count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="ml-2 shrink-0 text-sm font-medium text-green-600 dark:text-green-400">
                        +{r._sum.amount ?? 0}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Rewards</CardTitle></CardHeader>
          <CardContent>
            {recentRewards.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No rewards yet.</p>
            ) : (
              <div className="divide-y">
                {recentRewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {r.referrer.name || r.referrer.email} → {r.referee.name || r.referee.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="ml-2 shrink-0 text-sm font-medium text-green-600 dark:text-green-400">
                      +{r.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

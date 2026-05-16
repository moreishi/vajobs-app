import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReferralCard } from '@/components/dashboard/referral-card'
import { ReferralInviteForm } from '@/components/dashboard/referral-invite-form'
import { ReferralFAQ } from '@/components/dashboard/referral-faq'
import { getReferralConversionStats } from '@/lib/referrals'
import { getReferralRewardsHistory, getReferralInvites } from '@/actions/referrals'

export const dynamic = 'force-dynamic'

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [user, referredUsers, rewardAgg, rewardHistory, referralInvites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referralRewardsReceived: {
          where: { referrerId: userId },
          select: { amount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralReward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true },
    }),
    getReferralRewardsHistory(userId),
    getReferralInvites(userId),
  ])

  const totalEarnings = rewardAgg._sum.amount ?? 0
  const rewardedCount = referredUsers.filter(u => u.referralRewardsReceived.length > 0).length
  const conversionStats = getReferralConversionStats(referredUsers)

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Referrals</h1>

      {/* Invite by Email */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Invite by Email</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralInviteForm
            baseUrl={process.env.NEXT_PUBLIC_URL || process.env.AUTH_URL || 'http://localhost:3000'}
          />
        </CardContent>
      </Card>

      {user?.referralCode && (
        <div className="mb-8">
          <ReferralCard
            referralCode={user.referralCode}
            referralEarnings={totalEarnings}
            baseUrl={process.env.NEXT_PUBLIC_URL || process.env.AUTH_URL || 'http://localhost:3000'}
            conversionStats={conversionStats}
          />
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Referred Users</CardTitle>
            <span className="text-sm text-muted-foreground">
              {rewardedCount}/{referredUsers.length} rewarded
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {referredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">No referrals yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share your referral code to earn 10 connects when they join and complete their first action.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {referredUsers.map((ref) => {
                const earned = ref.referralRewardsReceived[0]?.amount
                return (
                  <div key={ref.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ref.name || ref.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`ml-2 shrink-0 text-sm font-medium ${earned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {earned ? `+${earned} connects` : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Invites */}
      {referralInvites.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sent Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {referralInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`ml-2 shrink-0 text-xs font-medium ${inv.status === 'signed_up' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {inv.status === 'signed_up' ? 'Signed up' : 'Invite sent'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards History */}
      {rewardHistory.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rewards History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rewardHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {entry.type === 'milestone' ? 'M' : 'R'}
                  </div>
                  <div className="min-w-0 flex-1">
                    {entry.type === 'referral' ? (
                      <>
                        <p className="text-sm font-medium">
                          {entry.refereeName || entry.refereeEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.label}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{entry.label}</p>
                        <p className="text-xs text-muted-foreground">Milestone bonus</p>
                      </>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-green-600 dark:text-green-400">
                    +{entry.amount} connects
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <div>
        <ReferralFAQ />
      </div>
    </>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/payments/registry'
import { PROVIDER_LABELS } from '@/lib/payments/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionPlansList } from '@/components/subscriptions/subscription-plans-list'
import { CurrentSubscriptionCard } from '@/components/subscriptions/current-subscription-card'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { name: activeProviderName } = await getActiveProvider()
  const providerLabel = PROVIDER_LABELS[activeProviderName]

  const [plans, activeSubscription] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.clientSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'cancelled'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Compute user's subscription history count
  const historyCount = await prisma.clientSubscription.count({
    where: { userId: session.user.id },
  })

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Membership</h1>

      {/* Current subscription */}
      {activeSubscription && (
        <div className="mb-8">
          <CurrentSubscriptionCard
            subscription={{
              ...activeSubscription,
              currentPeriodStart: activeSubscription.currentPeriodStart.toISOString(),
              currentPeriodEnd: activeSubscription.currentPeriodEnd.toISOString(),
              cancelledAt: activeSubscription.cancelledAt?.toISOString() ?? null,
            }}
          />
        </div>
      )}

      {/* Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Choose a Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Payments processed via {providerLabel}
          </p>
          {plans.length > 0 ? (
            <SubscriptionPlansList plans={plans} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No plans available yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscription History */}
      {historyCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History ({historyCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <Link href="/dashboard/subscriptions/history" className="text-primary hover:underline">
                View full history
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

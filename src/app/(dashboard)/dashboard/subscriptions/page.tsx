import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/payments/registry'
import { PROVIDER_LABELS } from '@/lib/payments/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
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

  // Compute counts
  const [historyCount, billingCount] = await Promise.all([
    prisma.clientSubscription.count({ where: { userId: session.user.id } }),
    prisma.paymentOrder.count({
      where: { userId: session.user.id, type: 'subscription', status: 'completed' },
    }),
  ])

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

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription History {historyCount > 0 && <span className="text-sm font-normal text-muted-foreground">({historyCount})</span>}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              View past subscriptions, status changes, and renewal history.
            </p>
            <Link href="/dashboard/subscriptions/history" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View History
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Invoices {billingCount > 0 && <span className="text-sm font-normal text-muted-foreground">({billingCount})</span>}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              View payment receipts, billing history, and download invoices.
            </p>
            <Link href="/dashboard/subscriptions/billing" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View Billing
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

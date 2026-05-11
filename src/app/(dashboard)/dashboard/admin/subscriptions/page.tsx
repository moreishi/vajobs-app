import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const [plans, subscriptions] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.clientSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const activeSubs = subscriptions.filter((s) => s.status === 'active').length
  const totalRevenue = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.plan.priceInCents, 0)

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
          &larr; Admin Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Subscription Management</h1>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{activeSubs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">${(totalRevenue / 100).toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Plans</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{plans.length}</p></CardContent>
        </Card>
      </div>

      {/* Plans */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Subscription Plans</CardTitle>
            <Link href="/dashboard/admin/subscriptions/new" className={buttonVariants({ size: 'sm' })}>
              Add Plan
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No plans created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] divide-y">
                <div className="grid grid-cols-8 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Name</span>
                  <span>Duration</span>
                  <span>Price</span>
                  <span>Contacts</span>
                  <span>Badge</span>
                  <span>Order</span>
                  <span>Active</span>
                  <span></span>
                </div>
                {plans.map((plan) => (
                  <div key={plan.id} className="grid grid-cols-8 gap-4 py-3 text-sm items-center">
                    <span className="font-medium">{plan.name}</span>
                    <span>{plan.durationMonths}mo</span>
                    <span>${(plan.priceInCents / 100).toFixed(2)}</span>
                    <span>{plan.connectsPerPeriod ?? '-'}</span>
                    <span>{plan.badge ? <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{plan.badge}</span> : '-'}</span>
                    <span>{plan.sortOrder}</span>
                    <span className={plan.active ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                      {plan.active ? 'Yes' : 'No'}
                    </span>
                    <Link
                      href={`/dashboard/admin/subscriptions/${plan.id}/edit`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Client Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] divide-y">
                <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Client</span>
                  <span>Plan</span>
                  <span>Status</span>
                  <span>Period End</span>
                  <span>Auto-Renew</span>
                  <span>Created</span>
                </div>
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="grid grid-cols-6 gap-4 py-3 text-sm items-center">
                    <span className="truncate">{sub.user.name || sub.user.email}</span>
                    <span>{sub.plan.name}</span>
                    <span className={`capitalize ${sub.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {sub.status}
                    </span>
                    <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                    <span>{sub.autoRenew ? 'Yes' : 'No'}</span>
                    <span className="text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { VaPlanForm } from './va-plan-form'

export const dynamic = 'force-dynamic'

export default async function AdminVaSubscriptionsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const [plans, subscriptions] = await Promise.all([
    prisma.vaSubscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.vaSubscription.findMany({
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
        <h1 className="mt-4 text-2xl font-bold">VA Subscription Management</h1>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active VA Subscriptions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{activeSubs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle></CardHeader>
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
          <CardTitle className="text-sm font-medium">VA Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No plans created yet. Add one below.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] divide-y">
                <div className="grid grid-cols-7 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Name</span>
                  <span>Price</span>
                  <span>Badge</span>
                  <span>Order</span>
                  <span>Active</span>
                  <span>Subscribers</span>
                  <span></span>
                </div>
                {plans.map((plan) => {
                  const subCount = subscriptions.filter((s) => s.planId === plan.id && s.status === 'active').length
                  return (
                    <form key={plan.id} action="/dashboard/admin/va-subscriptions" method="POST" className="contents">
                      <div className="grid grid-cols-7 gap-4 py-3 text-sm items-center">
                        <span className="font-medium">{plan.name}</span>
                        <span>${(plan.priceInCents / 100).toFixed(2)}/mo</span>
                        <span>{plan.badge ? <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{plan.badge}</span> : '-'}</span>
                        <span>{plan.sortOrder}</span>
                        <span className={plan.active ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                          {plan.active ? 'Yes' : 'No'}
                        </span>
                        <span>{subCount}</span>
                        <input type="hidden" name="planId" value={plan.id} />
                      </div>
                    </form>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add new plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Add VA Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <VaPlanForm />
        </CardContent>
      </Card>
    </>
  )
}

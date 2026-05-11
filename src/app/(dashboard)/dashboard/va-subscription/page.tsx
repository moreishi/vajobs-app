import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function VaSubscriptionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [plans, activeSub] = await Promise.all([
    prisma.vaSubscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.vaSubscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">VA Membership</h1>

      {/* Current subscription */}
      {activeSub && (
        <Card className="mb-8 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-bold">{activeSub.plan.name}</p>
                {activeSub.plan.description && (
                  <p className="text-sm text-muted-foreground">{activeSub.plan.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Started {new Date(activeSub.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>

            {/* Badge preview */}
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Your Profile Badge</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 ring-1 ring-rose-300/30">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Premium VA
              </span>
              <p className="mt-1.5 text-xs text-muted-foreground">
                This badge will appear on your talent profile while your subscription is active.
              </p>
            </div>

            <div className="mt-4">
              <VaCancelButton />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActive = activeSub?.planId === plan.id
            const features = JSON.parse(plan.features || '[]') as string[]

            return (
              <Card key={plan.id} className={`flex flex-col ${plan.badge ? 'border-primary ring-1 ring-primary' : ''} ${isActive ? 'opacity-75' : ''}`}>
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <CardHeader className={plan.badge ? 'pt-8' : ''}>
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  <p className="mt-2">
                    <span className="text-3xl font-bold">${(plan.priceInCents / 100).toFixed(0)}</span>
                    <span className="ml-1 text-sm text-muted-foreground">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {features.length > 0 && (
                    <ul className="mb-6 flex-1 space-y-2">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isActive ? (
                    <span className="mt-auto inline-flex items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                      Current Plan
                    </span>
                  ) : (
                    <form action={async () => {
                      'use server'
                      const { subscribeToVaPlan } = await import('@/actions/va-subscriptions')
                      await subscribeToVaPlan(plan.id)
                      redirect('/dashboard/va-subscription')
                    }}>
                      <button type="submit" className="mt-auto w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        {activeSub ? 'Switch to This Plan' : 'Subscribe'}
                      </button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No plans available right now. Check back later.</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function VaCancelButton() {
  return (
    <form
      action={async () => {
        'use server'
        const { cancelVaSubscription } = await import('@/actions/va-subscriptions')
        await cancelVaSubscription()
        redirect('/dashboard/va-subscription')
      }}
    >
      <button type="submit" className="text-sm text-destructive hover:underline">
        Cancel Subscription
      </button>
    </form>
  )
}

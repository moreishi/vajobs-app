'use client'

import { useActionState, useEffect } from 'react'
import { createSubscriptionCheckout } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  description: string | null
  durationMonths: number
  priceInCents: number
  currency: string
  connectsPerPeriod: number | null
  badge: string | null
  sortOrder: number
}

export function SubscriptionPlansList({ plans }: { plans: Plan[] }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; redirectUrl?: string } | undefined, formData: FormData) => {
      const planId = formData.get('planId') as string
      return createSubscriptionCheckout(planId)
    },
    undefined,
  )

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl
    }
  }, [state?.redirectUrl])

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        {plans.map((plan) => {
          const isPopular = !!plan.badge
          return (
            <Card
              key={plan.id}
              className={cn(
                'flex flex-col relative',
                isPopular && 'border-primary shadow-md ring-1 ring-primary',
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <CardHeader className={cn(isPopular && 'pt-8')}>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="mb-1 text-4xl font-bold">
                  {formatPrice(plan.priceInCents)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                {plan.connectsPerPeriod && plan.connectsPerPeriod > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Includes <strong>{plan.connectsPerPeriod} connects</strong> per month
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <form action={action} className="w-full">
                  <input type="hidden" name="planId" value={plan.id} />
                  <Button
                    type="submit"
                    disabled={pending}
                    className={cn('w-full', isPopular && '')}
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {pending ? 'Processing...' : isPopular ? 'Get Started' : 'Subscribe'}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

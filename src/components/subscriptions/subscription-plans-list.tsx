'use client'

import { useActionState, useEffect } from 'react'
import { createSubscriptionCheckout } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface Plan {
  id: string
  name: string
  description: string | null
  durationMonths: number
  priceInCents: number
  currency: string
  connectsPerPeriod: number | null
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

  const durationLabels: Record<number, string> = {
    1: '/month',
    3: '/quarter',
    6: '/6 months',
    12: '/year',
  }

  return (
    <div>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <p className="mb-4 text-3xl font-bold">
                {formatPrice(plan.priceInCents)}
                <span className="text-sm font-normal text-muted-foreground">
                  {durationLabels[plan.durationMonths] || `/${plan.durationMonths}mo`}
                </span>
              </p>
              {plan.connectsPerPeriod && plan.connectsPerPeriod > 0 && (
                <p className="text-sm text-muted-foreground">
                  Includes {plan.connectsPerPeriod} connects per period
                </p>
              )}
            </CardContent>
            <CardFooter>
              <form action={action} className="w-full">
                <input type="hidden" name="planId" value={plan.id} />
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full"
                >
                  {pending ? 'Processing...' : 'Subscribe'}
                </Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useActionState, useEffect, useState } from 'react'
import { createSubscriptionCheckout } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

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

const ANNUAL_DISCOUNT = 0.2

function annualPerMonth(monthlyCents: number) {
  return Math.round(monthlyCents * 12 * (1 - ANNUAL_DISCOUNT) / 12)
}

function formatPrice(cents: number) {
  return cents === 0 ? '0' : `${(cents / 100).toFixed(0)}`
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

  const [annual, setAnnual] = useState(false)

  return (
    <div>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm ${!annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(!annual)}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
          data-state={annual ? 'checked' : 'unchecked'}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
            data-state={annual ? 'checked' : 'unchecked'}
          />
        </button>
        <span className={`text-sm ${annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          Annual
        </span>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
          Save 20%
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {plans.map((plan) => {
          const isPopular = !!plan.badge
          const isFree = plan.priceInCents === 0
          const monthlyPrice = formatPrice(plan.priceInCents)
          const annualPerMonthCents = annualPerMonth(plan.priceInCents)
          const annualPriceDisplay = formatPrice(annualPerMonthCents)
          const annualTotalCents = annualPerMonthCents * 12
          const annualTotal = formatPrice(annualTotalCents)

          return (
            <Card
              key={plan.id}
              className={cn(
                'w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] flex flex-col relative',
                isPopular && 'border-primary shadow-md ring-1 ring-primary -translate-y-1',
              )}
            >
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <CardHeader className={cn(isPopular && 'pt-8', 'text-center')}>
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {isFree ? (
                  <p className="text-center text-4xl font-bold">$0</p>
                ) : (
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      ${annual ? annualPriceDisplay : monthlyPrice}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {annual ? '/mo' : '/month'}
                      </span>
                    </p>
                    {annual && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ${annualTotal}/yr
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex-1 space-y-3">
                  {PLAN_FEATURES[plan.name]?.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <form action={action} className="w-full">
                  <input type="hidden" name="planId" value={plan.id} />
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {pending ? 'Processing...' : isFree ? 'Get Started Free' : 'Subscribe'}
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

const PLAN_FEATURES: Record<string, string[]> = {
  Free: [
    'Browse Talent Profiles',
    'Hire & Communicate with Workers',
    'Up to 3 Job Posts',
    'Max 15 applications per Job',
    '2-day Job Post approval',
    'View Job Applications',
    'Bookmark Workers',
    'Saved Searches',
  ],
  Starter: [
    'Browse Talent Profiles',
    'Hire & Communicate with Workers',
    'Up to 5 Job Posts',
    'Max 200 applications per Job',
    'Instant Job Post approval',
    'View Job Applications',
    'Bookmark Workers',
    'Saved Searches',
    'Read & Leave Reviews',
    'Contact 75 workers / month',
    'Skill Assessments',
  ],
  Growth: [
    'Browse Talent Profiles',
    'Hire & Communicate with Workers',
    'AI Talent Matching',
    'Up to 10 Job Posts',
    'Max 200 applications per Job',
    'Instant Job Post approval',
    'View Job Applications',
    'Bookmark Workers',
    'Saved Searches',
    'Read & Leave Reviews',
    'Contact 200 workers / month',
    'Interview Scheduling',
    'Contracts & Documents',
  ],
  Scale: [
    'Browse Talent Profiles',
    'Hire & Communicate with Workers',
    'AI Talent Matching',
    'Unlimited Job Posts',
    'Max 200 applications per Job',
    'Instant Job Post approval',
    'View Job Applications',
    'Bookmark Workers',
    'Saved Searches',
    'Read & Leave Reviews',
    'Contact 500 workers / month',
    'Interview Scheduling',
    'Contracts & Documents',
    'Invoicing & Payments',
    'Priority Support',
  ],
}

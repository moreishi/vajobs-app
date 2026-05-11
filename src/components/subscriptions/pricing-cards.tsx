'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { CheckIcon } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string | null
  priceInCents: number
  badge: string | null
}

const TIER_FEATURES: Record<string, string[]> = {
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

const ANNUAL_DISCOUNT = 0.2

function annualPerMonth(monthlyCents: number) {
  return Math.round(monthlyCents * 12 * (1 - ANNUAL_DISCOUNT) / 12)
}

function formatPrice(cents: number) {
  return cents === 0 ? '0' : `${(cents / 100).toFixed(0)}`
}

export function PricingCards({ plans, isLoggedIn }: { plans: Plan[]; isLoggedIn: boolean }) {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
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
          const features = TIER_FEATURES[plan.name] || []
          const href = isLoggedIn ? '/dashboard/subscriptions' : '/register'

          const monthlyPrice = formatPrice(plan.priceInCents)
          const annualPerMonthCents = annualPerMonth(plan.priceInCents)
          const annualPriceDisplay = formatPrice(annualPerMonthCents)
          const annualTotalCents = annualPerMonthCents * 12
          const annualTotal = formatPrice(annualTotalCents)

          return (
            <div
              key={plan.id}
              className={cn(
                'w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] relative flex flex-col rounded-xl border bg-card p-6 sm:p-8 transition-all hover:shadow-lg',
                isPopular && 'border-primary shadow-md ring-1 ring-primary -translate-y-1',
              )}
            >
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className={cn(isPopular && 'pt-4', 'text-center')}>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}

                <div className="mt-4">
                  {isFree ? (
                    <p className="text-4xl font-bold">$0</p>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: isPopular ? 'default' : 'outline' }),
                  'mt-8 w-full',
                )}
              >
                {isFree ? 'Get Started Free' : isLoggedIn ? 'Choose Plan' : 'Get Started'}
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}

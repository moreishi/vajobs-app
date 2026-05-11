import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { CheckIcon } from 'lucide-react'

const TIER_FEATURES: Record<string, string[]> = {
  Starter: [
    '30 connects per month',
    'Post up to 3 active jobs',
    'Browse talent profiles',
    'Basic support',
    'Standard job visibility',
  ],
  Growth: [
    '100 connects per month',
    'Unlimited active jobs',
    'Featured job postings',
    'Priority support',
    'Advanced talent filters',
    'Analytics dashboard',
  ],
  Scale: [
    '350 connects per month',
    'Unlimited active jobs',
    'Dedicated account manager',
    'White-glove talent matching',
    'Custom onboarding',
    'API access',
    'Enterprise SLA',
  ],
}

export async function PricingSection() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (plans.length === 0) return null

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  return (
    <section className="border-b bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-muted-foreground">
            Choose the plan that fits your hiring needs. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 items-start max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = !!plan.badge
            const features = TIER_FEATURES[plan.name] || []
            const href = isLoggedIn ? '/dashboard/subscriptions' : '/register'

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-card p-6 sm:p-8 transition-all hover:shadow-lg',
                  isPopular && 'border-primary shadow-md ring-1 ring-primary scale-105 md:scale-110',
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className={cn(isPopular && 'pt-4')}>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4">
                    <span className="text-4xl font-bold">{formatPrice(plan.priceInCents)}</span>
                    <span className="ml-1 text-sm text-muted-foreground">/month</span>
                  </p>
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
                  {isLoggedIn ? 'Choose Plan' : 'Get Started'}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans are billed monthly. Cancel anytime. Connects reset each billing period.
        </p>
      </div>
    </section>
  )
}

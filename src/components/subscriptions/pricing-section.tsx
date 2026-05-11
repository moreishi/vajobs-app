import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PricingCards } from './pricing-cards'

export async function PricingSection() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (plans.length === 0) return null

  return (
    <section className="border-b bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-muted-foreground">
            Choose the plan that fits your hiring needs. Upgrade or cancel anytime.
          </p>
        </div>

        <PricingCards plans={plans} isLoggedIn={isLoggedIn} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans are billed monthly. Save 20% with annual billing.
        </p>
      </div>
    </section>
  )
}

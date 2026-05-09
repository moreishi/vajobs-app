import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/payments/registry'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const expiring = await prisma.clientSubscription.findMany({
    where: {
      status: 'active',
      autoRenew: true,
      currentPeriodEnd: { gte: now, lte: in24h },
    },
    include: { plan: true, user: { select: { id: true, name: true, email: true } } },
  })

  const results: { subscriptionId: string; status: string }[] = []

  for (const sub of expiring) {
    try {
      const { name, instance } = await getActiveProvider()
      const orderId = crypto.randomUUID()

      const { redirectUrl, sessionId } = await instance.createCheckout({
        type: 'subscription',
        priceInCents: sub.plan.priceInCents,
        userId: sub.userId,
        orderId,
        description: `${sub.plan.name} Renewal`,
        planId: sub.plan.id,
      })

      await prisma.paymentOrder.create({
        data: {
          id: orderId,
          userId: sub.userId,
          type: 'subscription',
          priceInCents: sub.plan.priceInCents,
          provider: name,
          providerSessionId: sessionId,
          status: 'pending',
          description: `${sub.plan.name} Renewal`,
          planId: sub.plan.id,
        },
      })

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          type: 'subscription_renewal',
          title: 'Subscription Renewal',
          body: `Your ${sub.plan.name} subscription is up for renewal. Click to complete payment.`,
          link: redirectUrl,
        },
      })

      results.push({ subscriptionId: sub.id, status: 'renewal_initiated' })
    } catch {
      results.push({ subscriptionId: sub.id, status: 'failed' })
    }
  }

  return NextResponse.json({ processed: expiring.length, results })
}

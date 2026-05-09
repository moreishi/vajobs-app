import { prisma } from '@/lib/prisma'

interface PaymentCompletedInput {
  orderId: string
  providerOrderId?: string
  providerName: string
}

export async function processPaymentCompleted(input: PaymentCompletedInput) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({
      where: { id: input.orderId },
      include: { plan: true },
    })

    if (!order || order.status !== 'pending') return

    await tx.paymentOrder.update({
      where: { id: input.orderId },
      data: {
        status: 'completed',
        providerOrderId: input.providerOrderId,
        completedAt: new Date(),
      },
    })

    if (order.type === 'subscription') {
      await handleSubscriptionCompleted(tx, order, input)
    } else {
      await handleConnectsCompleted(tx, order, input)
    }
  })
}

async function handleConnectsCompleted(tx: any, order: any, input: PaymentCompletedInput) {
  await tx.user.update({
    where: { id: order.userId },
    data: { connects: { increment: order.connectsAmount } },
  })

  await tx.connectTransaction.create({
    data: {
      userId: order.userId,
      amount: order.connectsAmount,
      type: 'purchase',
      description: `Purchased ${order.connectsAmount} connects via ${capitalize(input.providerName)}`,
      paymentOrderId: order.id,
    },
  })
}

async function handleSubscriptionCompleted(tx: any, order: any, input: PaymentCompletedInput) {
  const plan = order.plan
  if (!plan) return

  const periodStart = new Date()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + plan.durationMonths)

  // Find existing active or cancelled subscription for this user + plan
  const existing = await tx.clientSubscription.findFirst({
    where: {
      userId: order.userId,
      planId: plan.id,
      status: { in: ['active', 'cancelled'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing && existing.status === 'active') {
    // Renewal: extend the period end
    await tx.clientSubscription.update({
      where: { id: existing.id },
      data: {
        currentPeriodEnd: periodEnd,
        paymentOrderId: order.id,
        status: 'active',
        autoRenew: true,
      },
    })
  } else if (existing && existing.status === 'cancelled') {
    // Re-activate: new period from now
    await tx.clientSubscription.update({
      where: { id: existing.id },
      data: {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        paymentOrderId: order.id,
        status: 'active',
        autoRenew: true,
        cancelledAt: null,
      },
    })
  } else {
    // New subscription
    await tx.clientSubscription.create({
      data: {
        userId: order.userId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
        paymentOrderId: order.id,
      },
    })
  }

  // Credit connects if the plan grants them
  if (plan.connectsPerPeriod && plan.connectsPerPeriod > 0) {
    await tx.user.update({
      where: { id: order.userId },
      data: { connects: { increment: plan.connectsPerPeriod } },
    })

    await tx.connectTransaction.create({
      data: {
        userId: order.userId,
        amount: plan.connectsPerPeriod,
        type: 'subscription',
        description: `Subscription connects: ${plan.name}`,
        paymentOrderId: order.id,
      },
    })
  }

  // Upgrade guest role to client
  const user = await tx.user.findUnique({
    where: { id: order.userId },
    select: { role: true },
  })
  if (user && user.role === 'guest') {
    await tx.user.update({
      where: { id: order.userId },
      data: { role: 'client' },
    })
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

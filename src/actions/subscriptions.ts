'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/payments/registry'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export async function createSubscriptionCheckout(planId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  })
  if (!plan || !plan.active) return { error: 'Plan not found' }

  // Free plan — activate subscription directly without payment
  if (plan.priceInCents === 0) {
    // Cancel any existing active subscription
    await prisma.clientSubscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })

    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await prisma.clientSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      },
    })

    revalidatePath('/dashboard/subscriptions')
    return { redirectUrl: '/dashboard/subscriptions' }
  }

  const orderId = crypto.randomUUID()

  try {
    const { name, instance } = await getActiveProvider()
    const { redirectUrl, sessionId } = await instance.createCheckout({
      type: 'subscription',
      priceInCents: plan.priceInCents,
      userId,
      orderId,
      description: plan.name,
      planId: plan.id,
    })

    await prisma.paymentOrder.create({
      data: {
        id: orderId,
        userId,
        type: 'subscription',
        priceInCents: plan.priceInCents,
        provider: name,
        providerSessionId: sessionId,
        status: 'pending',
        description: plan.name,
        planId: plan.id,
      },
    })

    return { redirectUrl }
  } catch (error) {
    await prisma.paymentOrder.update({
      where: { id: orderId },
      data: { status: 'failed' },
    }).catch(() => {})

    return { error: error instanceof Error ? error.message : 'Payment provider unavailable' }
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const subscription = await prisma.clientSubscription.findUnique({
    where: { id: subscriptionId },
  })
  if (!subscription || subscription.userId !== userId) {
    return { error: 'Subscription not found' }
  }
  if (subscription.status !== 'active') {
    return { error: 'Subscription is not active' }
  }

  await prisma.clientSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'cancelled',
      autoRenew: false,
      cancelledAt: new Date(),
    },
  })

  await createNotification({
    userId,
    type: 'subscription_cancelled',
    title: 'Subscription Cancelled',
    body: 'Your subscription has been cancelled. You will retain access until the current billing period ends.',
    link: ROUTES.DASHBOARD,
  })

  revalidatePath('/dashboard/subscriptions')
  return { success: true }
}

export async function getAvailablePlans() {
  const session = await auth()
  if (!session?.user?.id) return { plans: [] }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { plans }
}

export async function getActiveSubscription() {
  const session = await auth()
  if (!session?.user?.id) return { subscription: null }

  const subscription = await prisma.clientSubscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  return { subscription }
}

export async function getSubscriptionHistory(page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user?.id) return { subscriptions: [], total: 0 }

  const [subscriptions, total] = await Promise.all([
    prisma.clientSubscription.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.clientSubscription.count({ where: { userId: session.user.id } }),
  ])

  return { subscriptions, total }
}

export async function toggleAutoRenew(subscriptionId: string, autoRenew: boolean) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const subscription = await prisma.clientSubscription.findUnique({
    where: { id: subscriptionId },
  })
  if (!subscription || subscription.userId !== userId) {
    return { error: 'Subscription not found' }
  }

  await prisma.clientSubscription.update({
    where: { id: subscriptionId },
    data: { autoRenew },
  })

  revalidatePath('/dashboard/subscriptions')
  return { success: true }
}

export async function getAllPlans() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { plans: [] }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return { plans }
}

export async function createPlan(data: {
  name: string
  description?: string
  durationMonths: number
  priceInCents: number
  connectsPerPeriod?: number
  badge?: string
  sortOrder?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      description: data.description,
      durationMonths: data.durationMonths,
      priceInCents: data.priceInCents,
      connectsPerPeriod: data.connectsPerPeriod,
      badge: data.badge,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  revalidatePath('/dashboard/admin/subscriptions')
  return { plan }
}

export async function updatePlan(
  planId: string,
  data: {
    name?: string
    description?: string
    durationMonths?: number
    priceInCents?: number
    connectsPerPeriod?: number
    badge?: string
    active?: boolean
    sortOrder?: number
  },
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data,
  })

  revalidatePath('/dashboard/admin/subscriptions')
  return { plan }
}

export async function getSubscriptionInvoices(page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user?.id) return { invoices: [], total: 0 }

  const [invoices, total] = await Promise.all([
    prisma.paymentOrder.findMany({
      where: {
        userId: session.user.id,
        type: 'subscription',
        status: 'completed',
      },
      include: { plan: true, clientSubscription: true },
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.paymentOrder.count({
      where: {
        userId: session.user.id,
        type: 'subscription',
        status: 'completed',
      },
    }),
  ])

  return { invoices, total }
}

export async function getSubscriptionManagementList() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { subscriptions: [] }

  const subscriptions = await prisma.clientSubscription.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return { subscriptions }
}

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function createVaPlan(data: {
  name: string
  description?: string
  priceInCents: number
  features?: string
  badge?: string
  sortOrder?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const plan = await prisma.vaSubscriptionPlan.create({
    data: {
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      features: data.features || '[]',
      badge: data.badge,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  revalidatePath('/dashboard/admin/va-subscriptions')
  return { plan }
}

export async function updateVaPlan(
  planId: string,
  data: {
    name?: string
    description?: string
    priceInCents?: number
    features?: string
    badge?: string
    active?: boolean
    sortOrder?: number
  },
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const plan = await prisma.vaSubscriptionPlan.update({
    where: { id: planId },
    data,
  })

  revalidatePath('/dashboard/admin/va-subscriptions')
  return { plan }
}

export async function subscribeToVaPlan(planId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const plan = await prisma.vaSubscriptionPlan.findUnique({
    where: { id: planId },
  })
  if (!plan || !plan.active) return { error: 'Plan not found' }

  // Cancel any existing active subscription
  await prisma.vaSubscription.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'cancelled', endDate: new Date() },
  })

  const subscription = await prisma.vaSubscription.create({
    data: {
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: null,
    },
  })

  revalidatePath('/dashboard/va-subscription')
  return { subscription }
}

export async function cancelVaSubscription() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const subscription = await prisma.vaSubscription.findFirst({
    where: { userId, status: 'active' },
  })
  if (!subscription) return { error: 'No active subscription' }

  await prisma.vaSubscription.update({
    where: { id: subscription.id },
    data: { status: 'cancelled', endDate: new Date() },
  })

  revalidatePath('/dashboard/va-subscription')
  return { success: true }
}

export async function getActiveVaSubscription() {
  const session = await auth()
  if (!session?.user?.id) return { subscription: null, plan: null }

  const subscription = await prisma.vaSubscription.findFirst({
    where: { userId: session.user.id, status: 'active' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  return {
    subscription: subscription || null,
    plan: subscription?.plan || null,
  }
}

export async function getVaSubscriptionHistory() {
  const session = await auth()
  if (!session?.user?.id) return { subscriptions: [] }

  const subscriptions = await prisma.vaSubscription.findMany({
    where: { userId: session.user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  return { subscriptions }
}

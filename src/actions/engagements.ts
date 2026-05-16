'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'
import { awardXp } from '@/actions/reputation'

export async function getEngagements(userId: string, role: string, status?: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const whereStatus = status === 'ended' ? 'ended' : 'active'

  const where = role === 'talent'
    ? { talentId: userId, status: whereStatus }
    : { clientId: userId, status: whereStatus }

  return prisma.engagement.findMany({
    where,
    include: {
      jobPost: { select: { id: true, title: true } },
      talent: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function getEngagementById(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: {
      jobPost: {
        select: { id: true, title: true, description: true, salaryRange: true, type: true },
      },
      talent: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      application: {
        select: { id: true, coverLetter: true, review: true },
      },
      contract: {
        include: {
          invoices: { orderBy: { createdAt: 'desc' } },
          milestones: { orderBy: { createdAt: 'asc' } },
          client: { select: { id: true, name: true, email: true } },
          talent: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!engagement) return null

  const isTalent = engagement.talentId === session.user.id
  const isClient = engagement.clientId === session.user.id
  if (!isTalent && !isClient) return null

  return engagement
}

export async function endEngagement(engagementId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
  })
  if (!engagement) return { error: 'Engagement not found' }
  if (engagement.clientId !== session.user.id) {
    return { error: 'Only the client can end an engagement' }
  }
  if (engagement.status === 'ended') {
    return { error: 'Engagement is already ended' }
  }

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { status: 'ended', endDate: new Date() },
  })

  // Award XP to both parties when engagement ends
  await awardXp({ userId: engagement.talentId, amount: 50, reason: 'engagement_ended', referenceId: `engagement_ended_${engagementId}_talent` })
  await awardXp({ userId: engagement.clientId, amount: 50, reason: 'engagement_ended', referenceId: `engagement_ended_${engagementId}_client` })

  await createNotification({
    userId: engagement.talentId,
    type: 'engagement_ended',
    title: 'Engagement Ended',
    body: 'Your engagement has been ended by the client.',
    link: ROUTES.ENGAGEMENT_DETAIL(engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENTS)
  revalidatePath(`/dashboard/engagements/${engagementId}`)
  return { success: true }
}

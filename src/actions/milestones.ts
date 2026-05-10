'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export type MilestoneData = {
  id: string
  contractId: string
  title: string
  description: string | null
  amount: number
  dueDate: Date | null
  status: string
  completedAt: Date | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getMilestones(
  contractId: string,
): Promise<{ success: true; data: MilestoneData[] } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, clientId: true, talentId: true },
  })
  if (!contract) return { success: false, error: 'Contract not found' }

  const isParticipant = contract.clientId === session.user.id || contract.talentId === session.user.id
  if (!isParticipant) return { success: false, error: 'Not authorized' }

  const milestones = await prisma.milestone.findMany({
    where: { contractId },
    orderBy: { createdAt: 'asc' },
  })

  return { success: true, data: milestones }
}

export async function createMilestone(data: {
  contractId: string
  title: string
  description?: string
  amount: number
  dueDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
    select: { id: true, clientId: true, talentId: true, status: true, engagementId: true },
  })
  if (!contract) return { error: 'Contract not found' }
  if (contract.status !== 'active') return { error: 'Contract is not active' }

  const isParticipant = contract.clientId === session.user.id || contract.talentId === session.user.id
  if (!isParticipant) return { error: 'Not authorized' }

  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.amount || data.amount <= 0) return { error: 'Amount must be positive' }

  const milestone = await prisma.milestone.create({
    data: {
      contractId: data.contractId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })

  const otherId = contract.clientId === session.user.id ? contract.talentId : contract.clientId
  await createNotification({
    userId: otherId,
    type: 'milestone_created',
    title: 'New Milestone',
    body: `A milestone "${data.title}" has been added to the contract.`,
    link: ROUTES.ENGAGEMENT_DETAIL(contract.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(contract.engagementId))
  return { success: true, data: milestone }
}

export async function completeMilestone(milestoneId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { contract: { select: { talentId: true, clientId: true, engagementId: true } } },
  })
  if (!milestone) return { error: 'Milestone not found' }
  if (milestone.contract.talentId !== session.user.id) {
    return { error: 'Only the talent can mark milestones as completed' }
  }
  if (milestone.status !== 'pending') return { error: 'Milestone is not in pending status' }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'completed', completedAt: new Date() },
  })

  await createNotification({
    userId: milestone.contract.clientId,
    type: 'milestone_completed',
    title: 'Milestone Completed',
    body: `The milestone "${milestone.title}" has been marked as completed.`,
    link: ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId))
  return { success: true }
}

export async function approveMilestone(milestoneId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { contract: { select: { clientId: true, talentId: true, engagementId: true } } },
  })
  if (!milestone) return { error: 'Milestone not found' }
  if (milestone.contract.clientId !== session.user.id) {
    return { error: 'Only the client can approve milestones' }
  }
  if (milestone.status !== 'completed') return { error: 'Milestone is not in completed status' }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'approved', approvedAt: new Date() },
  })

  await createNotification({
    userId: milestone.contract.talentId,
    type: 'milestone_approved',
    title: 'Milestone Approved',
    body: `The milestone "${milestone.title}" has been approved.`,
    link: ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId))
  return { success: true }
}

export async function rejectMilestone(milestoneId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { contract: { select: { clientId: true, talentId: true, engagementId: true } } },
  })
  if (!milestone) return { error: 'Milestone not found' }
  if (milestone.contract.clientId !== session.user.id) {
    return { error: 'Only the client can reject milestones' }
  }
  if (milestone.status !== 'completed') return { error: 'Milestone is not in completed status' }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'pending', completedAt: null },
  })

  await createNotification({
    userId: milestone.contract.talentId,
    type: 'milestone_rejected',
    title: 'Milestone Rejected',
    body: `The milestone "${milestone.title}" needs revisions.`,
    link: ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(milestone.contract.engagementId))
  return { success: true }
}

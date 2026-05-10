'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export type ContractData = {
  id: string
  engagementId: string
  clientId: string
  talentId: string
  title: string
  terms: string
  rate: number
  rateType: string
  startDate: Date
  endDate: Date | null
  status: string
  signedAt: Date | null
  createdAt: Date
  updatedAt: Date
  client: { id: string; name: string | null; email: string }
  talent: { id: string; name: string | null; email: string }
}

export async function getContract(
  engagementId: string,
): Promise<{ success: true; data: ContractData } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { engagementId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      talent: { select: { id: true, name: true, email: true } },
    },
  })

  if (!contract) return { success: false, error: 'Contract not found' }

  const isParticipant = contract.clientId === session.user.id || contract.talentId === session.user.id
  if (!isParticipant) return { success: false, error: 'Not authorized' }

  return { success: true, data: contract }
}

export async function createContract(data: {
  engagementId: string
  title: string
  terms: string
  rate: number
  rateType: string
  startDate: string
  endDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client') return { error: 'Only clients can create contracts' }

  const engagement = await prisma.engagement.findUnique({
    where: { id: data.engagementId },
    select: { id: true, clientId: true, talentId: true, jobPostId: true, status: true },
  })
  if (!engagement) return { error: 'Engagement not found' }
  if (engagement.clientId !== session.user.id) return { error: 'Not authorized' }
  if (engagement.status !== 'active') return { error: 'Engagement is not active' }

  const existing = await prisma.contract.findUnique({
    where: { engagementId: data.engagementId },
  })
  if (existing) return { error: 'A contract already exists for this engagement' }

  const contract = await prisma.contract.create({
    data: {
      engagementId: data.engagementId,
      clientId: engagement.clientId,
      talentId: engagement.talentId,
      title: data.title,
      terms: data.terms,
      rate: data.rate,
      rateType: data.rateType,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  })

  await createNotification({
    userId: engagement.talentId,
    type: 'contract_created',
    title: 'New Contract',
    body: `A contract for "${data.title}" is ready for your review.`,
    link: ROUTES.ENGAGEMENT_DETAIL(engagement.id),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(engagement.id))
  return { success: true, data: contract }
}

export async function signContract(contractId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { engagement: { select: { id: true } } },
  })
  if (!contract) return { error: 'Contract not found' }
  if (contract.talentId !== session.user.id && contract.clientId !== session.user.id) {
    return { error: 'Not authorized' }
  }
  if (contract.status !== 'draft') return { error: 'Contract is not in draft status' }

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'active', signedAt: new Date() },
  })

  const otherId = contract.clientId === session.user.id ? contract.talentId : contract.clientId
  await createNotification({
    userId: otherId,
    type: 'contract_signed',
    title: 'Contract Signed',
    body: `The contract has been signed and is now active.`,
    link: ROUTES.ENGAGEMENT_DETAIL(contract.engagement.id),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(contract.engagement.id))
  return { success: true }
}

export async function terminateContract(contractId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { engagement: { select: { id: true } } },
  })
  if (!contract) return { error: 'Contract not found' }
  if (contract.clientId !== session.user.id) return { error: 'Only the client can terminate a contract' }
  if (contract.status !== 'active') return { error: 'Contract is not active' }

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'terminated' },
  })

  await createNotification({
    userId: contract.talentId,
    type: 'contract_terminated',
    title: 'Contract Terminated',
    body: `The contract "${contract.title}" has been terminated.`,
    link: ROUTES.ENGAGEMENT_DETAIL(contract.engagement.id),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(contract.engagement.id))
  return { success: true }
}

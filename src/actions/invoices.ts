'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export type InvoiceData = {
  id: string
  contractId: string
  engagementId: string
  fromId: string
  toId: string
  amount: number
  currency: string
  description: string | null
  status: string
  dueDate: Date | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getInvoices(
  engagementId: string,
): Promise<{ success: true; data: InvoiceData[] } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    select: { id: true, clientId: true, talentId: true },
  })
  if (!engagement) return { success: false, error: 'Engagement not found' }

  const isParticipant = engagement.clientId === session.user.id || engagement.talentId === session.user.id
  if (!isParticipant) return { success: false, error: 'Not authorized' }

  const invoices = await prisma.invoice.findMany({
    where: { engagementId },
    orderBy: { createdAt: 'desc' },
  })

  return { success: true, data: invoices }
}

export async function createInvoice(data: {
  contractId: string
  engagementId: string
  amount: number
  description?: string
  dueDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
    select: { id: true, clientId: true, talentId: true, status: true },
  })
  if (!contract) return { error: 'Contract not found' }
  if (contract.status !== 'active') return { error: 'Contract is not active' }

  const isTalent = contract.talentId === session.user.id
  const isClient = contract.clientId === session.user.id
  if (!isTalent && !isClient) return { error: 'Not authorized' }

  const invoice = await prisma.invoice.create({
    data: {
      contractId: data.contractId,
      engagementId: data.engagementId,
      fromId: session.user.id,
      toId: isTalent ? contract.clientId : contract.talentId,
      amount: data.amount,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })

  const recipientId = isTalent ? contract.clientId : contract.talentId
  await createNotification({
    userId: recipientId,
    type: 'invoice_received',
    title: 'New Invoice',
    body: `An invoice for $${data.amount.toFixed(2)} has been created.`,
    link: ROUTES.ENGAGEMENT_DETAIL(data.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(data.engagementId))
  return { success: true, data: invoice }
}

export async function markInvoicePaid(invoiceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, toId: true, fromId: true, engagementId: true, amount: true, status: true },
  })
  if (!invoice) return { error: 'Invoice not found' }

  const isRecipient = invoice.toId === session.user.id
  const isSender = invoice.fromId === session.user.id
  if (!isRecipient && !isSender) return { error: 'Not authorized' }
  if (invoice.status === 'paid') return { error: 'Invoice is already paid' }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid', paidAt: new Date() },
  })

  const notifyId = isRecipient ? invoice.fromId : invoice.toId
  await createNotification({
    userId: notifyId,
    type: 'invoice_paid',
    title: 'Invoice Paid',
    body: `An invoice for $${invoice.amount.toFixed(2)} has been marked as paid.`,
    link: ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId))
  return { success: true }
}

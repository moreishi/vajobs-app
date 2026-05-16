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

  if (contract.talentId !== session.user.id) return { error: 'Only the talent can create invoices' }

  const invoice = await prisma.invoice.create({
    data: {
      contractId: data.contractId,
      engagementId: data.engagementId,
      fromId: session.user.id,
      toId: contract.clientId,
      amount: data.amount,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })

  await createNotification({
    userId: contract.clientId,
    type: 'invoice_received',
    title: 'New Invoice',
    body: `An invoice for $${data.amount.toFixed(2)} has been created.`,
    link: ROUTES.ENGAGEMENT_DETAIL(data.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(data.engagementId))
  return { success: true, data: invoice }
}

// Client marks invoice as paid (off-platform / manual) → paid_pending
export async function markInvoicePaid(invoiceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, toId: true, fromId: true, engagementId: true, amount: true, status: true },
  })
  if (!invoice) return { error: 'Invoice not found' }

  if (invoice.toId !== session.user.id) return { error: 'Only the client can mark an invoice as paid' }
  if (invoice.status === 'paid') return { error: 'Invoice is already paid' }
  if (invoice.status === 'paid_pending') return { error: 'Invoice is already pending confirmation' }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid_pending' },
  })

  await createNotification({
    userId: invoice.fromId,
    type: 'invoice_paid',
    title: 'Invoice Marked as Paid',
    body: `The client has marked an invoice for $${invoice.amount.toFixed(2)} as paid. Please confirm receipt.`,
    link: ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId))
  return { success: true }
}

// Talent confirms receipt → paid
export async function confirmInvoiceReceipt(invoiceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, toId: true, fromId: true, engagementId: true, amount: true, status: true },
  })
  if (!invoice) return { error: 'Invoice not found' }

  if (invoice.fromId !== session.user.id) return { error: 'Only the talent can confirm receipt' }
  if (invoice.status !== 'paid_pending') return { error: 'Invoice is not pending confirmation' }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid', paidAt: new Date() },
  })

  await createNotification({
    userId: invoice.toId,
    type: 'invoice_paid',
    title: 'Payment Confirmed',
    body: `The talent has confirmed receipt of $${invoice.amount.toFixed(2)}. Invoice is now paid.`,
    link: ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId),
  })

  revalidatePath(ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId))
  return { success: true }
}

// Auto-confirm paid_pending invoices after 7 days
export async function autoConfirmInvoicePayments() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const stale = await prisma.invoice.findMany({
    where: { status: 'paid_pending', updatedAt: { lte: sevenDaysAgo } },
    select: { id: true, fromId: true, toId: true, engagementId: true, amount: true },
  })

  for (const invoice of stale) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'paid', paidAt: new Date() },
    })

    await createNotification({
      userId: invoice.fromId,
      type: 'invoice_paid',
      title: 'Payment Auto-Confirmed',
      body: `Payment of $${invoice.amount.toFixed(2)} has been auto-confirmed after 7 days.`,
      link: ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId),
    })

    await createNotification({
      userId: invoice.toId,
      type: 'invoice_paid',
      title: 'Payment Auto-Confirmed',
      body: `Payment of $${invoice.amount.toFixed(2)} has been auto-confirmed after 7 days.`,
      link: ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId),
    })
  }

  return { success: true, autoConfirmed: stale.length }
}

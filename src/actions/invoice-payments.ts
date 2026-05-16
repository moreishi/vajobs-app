'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { getProvider, checkProviderConfigured } from '@/lib/payments'
import type { ProviderName } from '@/lib/payments'

export async function createInvoiceCheckoutSession(
  invoiceId: string,
  providerName: ProviderName,
): Promise<{ error: string } | { redirectUrl: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      contractId: true,
      engagementId: true,
      amount: true,
      currency: true,
      description: true,
      status: true,
      toId: true,
      fromId: true,
      contract: {
        select: {
          engagement: {
            select: { clientId: true, talentId: true },
          },
        },
      },
    },
  })
  if (!invoice) return { error: 'Invoice not found' }

  const isRecipient = invoice.toId === session.user.id
  if (!isRecipient) return { error: 'Only the invoice recipient can make payments' }
  if (invoice.status === 'paid' || invoice.status === 'paid_pending') return { error: 'Invoice is already paid or pending confirmation' }

  if (!checkProviderConfigured(providerName)) {
    return { error: `${providerName} is not configured` }
  }

  const provider = getProvider(providerName)
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const engagementUrl = ROUTES.ENGAGEMENT_DETAIL(invoice.engagementId)

  // Create PaymentOrder
  const paymentOrder = await prisma.paymentOrder.create({
    data: {
      userId: session.user.id,
      type: 'invoice',
      priceInCents: Math.round(invoice.amount * 100),
      currency: invoice.currency.toLowerCase(),
      provider: providerName,
      description: invoice.description || `Invoice payment`,
      invoiceId: invoice.id,
      status: 'pending',
    },
  })

  try {
    const result = await provider.createCheckout({
      type: 'invoice',
      priceInCents: Math.round(invoice.amount * 100),
      userId: session.user.id,
      orderId: paymentOrder.id,
      invoiceId: invoice.id,
      invoiceAmount: invoice.amount,
      invoiceCurrency: invoice.currency,
      description: invoice.description || undefined,
      successUrl: `${baseUrl}${engagementUrl}?payment=success`,
      cancelUrl: `${baseUrl}${engagementUrl}?payment=cancelled`,
    })

    // Update PaymentOrder with session ID
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: { providerSessionId: result.sessionId },
    })

    return { redirectUrl: result.redirectUrl }
  } catch (err) {
    // Clean up the payment order on failure
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: { status: 'failed' },
    })

    const message = err instanceof Error ? err.message : 'Payment checkout creation failed'
    return { error: message }
  }
}

export async function getInvoicePaymentStatus(
  invoiceId: string,
): Promise<{ status: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true, toId: true, fromId: true },
  })
  if (!invoice) return { error: 'Invoice not found' }

  const isParticipant = invoice.toId === session.user.id || invoice.fromId === session.user.id
  if (!isParticipant) return { error: 'Not authorized' }

  return { status: invoice.status }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WiseProvider } from '@/lib/payments/wise'

const provider = new WiseProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.providerOrderId) {
    // Wise webhook sends transfer IDs. Try to find the PaymentOrder
    // via providerOrderId (stored during checkout) or fallback to orderId.
    let paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        providerOrderId: result.providerOrderId,
        type: 'invoice',
        status: 'pending',
      },
    })

    // Fallback: try direct orderId
    if (!paymentOrder && result.orderId) {
      paymentOrder = await prisma.paymentOrder.findUnique({
        where: { id: result.orderId },
      })
    }

    const invoiceId = paymentOrder?.invoiceId
    if (paymentOrder && invoiceId) {
      await prisma.$transaction(async (tx) => {
        await tx.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: {
            status: 'completed',
            providerOrderId: result.providerOrderId,
            completedAt: new Date(),
          },
        })

        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid', paidAt: new Date() },
        })
      })
    }
  }

  return NextResponse.json({ received: true })
}

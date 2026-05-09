import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { HitPayProvider } from '@/lib/payments/hitpay'

const provider = new HitPayProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.paymentOrder.findUnique({
        where: { id: result.orderId },
      })
      if (!order || order.status !== 'pending') return

      await tx.paymentOrder.update({
        where: { id: result.orderId },
        data: {
          status: 'completed',
          providerOrderId: result.providerOrderId,
          completedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: order.userId },
        data: { connects: { increment: order.connectsAmount } },
      })

      await tx.connectTransaction.create({
        data: {
          userId: order.userId,
          amount: order.connectsAmount,
          type: 'purchase',
          description: `Purchased ${order.connectsAmount} connects via HitPay`,
          paymentOrderId: result.orderId,
        },
      })
    })
  }

  return NextResponse.json({ received: true })
}

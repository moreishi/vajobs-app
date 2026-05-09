import { NextResponse } from 'next/server'
import { HitPayProvider } from '@/lib/payments/hitpay'
import { processPaymentCompleted } from '@/lib/payments/process-payment'

const provider = new HitPayProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await processPaymentCompleted({
      orderId: result.orderId,
      providerOrderId: result.providerOrderId,
      providerName: 'hitpay',
    })
  }

  return NextResponse.json({ received: true })
}

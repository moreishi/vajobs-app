import { NextResponse } from 'next/server'
import { MayaProvider } from '@/lib/payments/maya'
import { processPaymentCompleted } from '@/lib/payments/process-payment'

const provider = new MayaProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await processPaymentCompleted({
      orderId: result.orderId,
      providerOrderId: result.providerOrderId,
      providerName: 'maya',
    })
  }

  return NextResponse.json({ received: true })
}

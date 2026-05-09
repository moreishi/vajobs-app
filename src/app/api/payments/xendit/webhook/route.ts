import { NextResponse } from 'next/server'
import { XenditProvider } from '@/lib/payments/xendit'
import { processPaymentCompleted } from '@/lib/payments/process-payment'

const provider = new XenditProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await processPaymentCompleted({
      orderId: result.orderId,
      providerOrderId: result.providerOrderId,
      providerName: 'xendit',
    })
  }

  return NextResponse.json({ received: true })
}

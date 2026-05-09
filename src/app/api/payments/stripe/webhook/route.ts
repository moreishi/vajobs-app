import { NextResponse } from 'next/server'
import { StripeProvider } from '@/lib/payments/stripe'
import { processPaymentCompleted } from '@/lib/payments/process-payment'

const provider = new StripeProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await processPaymentCompleted({
      orderId: result.orderId,
      providerOrderId: result.providerOrderId,
      providerName: 'stripe',
    })
  }

  return NextResponse.json({ received: true })
}

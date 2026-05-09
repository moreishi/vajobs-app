import { NextResponse } from 'next/server'
import { PayPalProvider } from '@/lib/payments/paypal'
import { processPaymentCompleted } from '@/lib/payments/process-payment'

const provider = new PayPalProvider()

export async function POST(request: Request) {
  const result = await provider.handleWebhook(request)

  if (result.event === 'payment.completed' && result.orderId) {
    await processPaymentCompleted({
      orderId: result.orderId,
      providerOrderId: result.providerOrderId,
      providerName: 'paypal',
    })
  }

  return NextResponse.json({ received: true })
}

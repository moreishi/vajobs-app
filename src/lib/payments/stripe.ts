import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

export class StripeProvider implements PaymentProvider {
  readonly name: ProviderName = 'stripe'

  private getClient() {
    const { default: Stripe } = require('stripe')
    return new Stripe(process.env.STRIPE_SECRET_KEY!)
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const stripe = this.getClient()

    let itemName: string
    let successUrl: string
    let cancelUrl: string
    let metadata: Record<string, string> = {
      userId: params.userId,
      orderId: params.orderId,
    }

    if (params.type === 'invoice' && params.invoiceId) {
      itemName = params.description || `Invoice Payment #${params.invoiceId.slice(0, 8)}`
      successUrl = params.successUrl || `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/engagements`
      cancelUrl = params.cancelUrl || `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/engagements`
      metadata.invoiceId = params.invoiceId
    } else {
      itemName = params.description || (params.connectsAmount ? `${params.connectsAmount} Connects` : 'Payment')
      successUrl = `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=success`
      cancelUrl = `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=cancelled`
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
            },
            unit_amount: params.priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return { redirectUrl: session.url!, sessionId: session.id }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const stripe = this.getClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      verified: session.payment_status === 'paid',
      providerOrderId: session.payment_intent as string | undefined,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const stripe = this.getClient()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return { event: 'ignored' }
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return { event: 'ignored' }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      if (orderId) {
        return {
          event: 'payment.completed',
          orderId,
          providerOrderId: session.payment_intent,
        }
      }
    }

    return { event: 'ignored' }
  }
}

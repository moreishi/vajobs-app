import { createHmac } from 'crypto'
import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

const API_BASE = 'https://api.hitpayapp.com/v1'

export class HitPayProvider implements PaymentProvider {
  readonly name: ProviderName = 'hitpay'

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const dollarAmount = (params.priceInCents / 100).toFixed(2)
    const itemName = params.description || (params.connectsAmount ? `${params.connectsAmount} Connects` : 'Payment')

    const res = await fetch(`${API_BASE}/payment-requests`, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.HITPAY_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        amount: dollarAmount,
        currency: 'USD',
        reference_number: params.orderId,
        redirect_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=success`,
        webhook: `${process.env.AUTH_URL || 'http://localhost:3000'}/api/payments/hitpay/webhook`,
        channel: 'api',
        purpose: itemName,
      }).toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HitPay payment request failed: ${err}`)
    }

    const data = await res.json()
    return {
      redirectUrl: data.url,
      sessionId: data.id,
    }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const res = await fetch(`${API_BASE}/payment-requests/${sessionId}`, {
      headers: { 'X-API-KEY': process.env.HITPAY_API_KEY! },
    })

    if (!res.ok) return { verified: false }

    const data = await res.json()
    return {
      verified: data.status === 'completed',
      orderId: data.reference_number,
      providerOrderId: data.id,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    const salt = process.env.HITPAY_SALT

    // Verify HMAC signature
    if (salt && signature) {
      const expected = createHmac('sha256', salt).update(body).digest('hex')
      if (expected !== signature) {
        return { event: 'ignored' }
      }
    }

    let data: Record<string, string> = {}
    try {
      // HitPay sends form-encoded data
      const params = new URLSearchParams(body)
      data = Object.fromEntries(params.entries())
    } catch {
      return { event: 'ignored' }
    }

    if (data.status === 'completed') {
      return {
        event: 'payment.completed',
        orderId: data.reference_number,
        providerOrderId: data.payment_id || data.id,
      }
    }

    return { event: 'ignored' }
  }
}

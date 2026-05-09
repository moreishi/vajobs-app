import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

const API_BASE = 'https://api.xendit.co'

function getAuthHeader(): string {
  const key = process.env.XENDIT_SECRET_KEY!
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

export class XenditProvider implements PaymentProvider {
  readonly name: ProviderName = 'xendit'

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const res = await fetch(`${API_BASE}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: params.orderId,
        amount: params.priceInCents,
        currency: 'USD',
        description: `${params.connectsAmount} Connects`,
        success_redirect_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=success`,
        failure_redirect_url: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=failed`,
        customer: { user_id: params.userId },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Xendit invoice creation failed: ${err}`)
    }

    const data = await res.json()
    return {
      redirectUrl: data.invoice_url,
      sessionId: data.id,
    }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const res = await fetch(`${API_BASE}/v2/invoices/${sessionId}`, {
      headers: { 'Authorization': getAuthHeader() },
    })

    if (!res.ok) return { verified: false }

    const data = await res.json()
    return {
      verified: data.status === 'PAID' || data.status === 'SETTLED',
      orderId: data.external_id,
      providerOrderId: data.id,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const body = await request.text()

    let data: Record<string, unknown>
    try {
      data = JSON.parse(body)
    } catch {
      return { event: 'ignored' }
    }

    const status = data.status as string | undefined
    if (status === 'PAID' || status === 'SETTLED') {
      const orderId = data.external_id as string | undefined
      if (orderId) {
        return {
          event: 'payment.completed',
          orderId,
          providerOrderId: data.id as string,
        }
      }
    }

    return { event: 'ignored' }
  }
}

import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

const API_BASE = process.env.WISE_SANDBOX === 'true'
  ? 'https://api.sandbox.wise.com'
  : 'https://api.wise.com'

export class WiseProvider implements PaymentProvider {
  readonly name: ProviderName = 'wise'

  private getToken(): string {
    return process.env.WISE_API_TOKEN || ''
  }

  private getProfileId(): string {
    return process.env.WISE_PROFILE_ID || ''
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
    const sessionId = params.orderId

    // If Wise API is configured, create a quote and payment link
    const token = this.getToken()
    if (token && this.getProfileId()) {
      try {
        const dollarAmount = (params.priceInCents / 100).toFixed(2)

        // Create a quote
        const quoteRes = await fetch(`${API_BASE}/v3/profiles/${this.getProfileId()}/quotes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceCurrency: params.invoiceCurrency || 'USD',
            targetCurrency: params.invoiceCurrency || 'USD',
            sourceAmount: parseFloat(dollarAmount),
          }),
        })

        if (quoteRes.ok) {
          const quote = await quoteRes.json()
          return {
            redirectUrl: `${baseUrl}/dashboard/invoices/pay/wise-instructions?paymentOrderId=${sessionId}&quoteId=${quote.id}`,
            sessionId,
          }
        }
      } catch {
        // Fall through to basic instructions page if Wise API call fails
      }
    }

    // Fallback: return a redirect to our instructions page
    return {
      redirectUrl: `${baseUrl}/dashboard/invoices/pay/wise-instructions?paymentOrderId=${sessionId}`,
      sessionId,
    }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const token = this.getToken()
    if (!token) return { verified: false }

    try {
      const res = await fetch(`${API_BASE}/v1/transfers/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) return { verified: false }

      const transfer = await res.json()
      const isCompleted = transfer.status === 'outgoing_payment_sent'
        || transfer.status === 'funds_converted'
        || transfer.status === 'completed'

      return {
        verified: isCompleted,
        orderId: transfer.reference || sessionId,
        providerOrderId: sessionId,
      }
    } catch {
      return { verified: false }
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const body = await request.text()

    let event: Record<string, unknown>
    try {
      event = JSON.parse(body)
    } catch {
      return { event: 'ignored' }
    }

    // Wise webhook: transfers#state-change
    if (event.event_type === 'transfers#state-change') {
      const data = event.data as Record<string, unknown> | undefined
      const currentState = data?.current_state as string | undefined
      const transferId = data?.resource_id as string | undefined

      if (
        transferId &&
        (currentState === 'outgoing_payment_sent' || currentState === 'funds_converted' || currentState === 'completed')
      ) {
        return {
          event: 'payment.completed',
          orderId: transferId,
          providerOrderId: transferId,
        }
      }
    }

    return { event: 'ignored' }
  }
}

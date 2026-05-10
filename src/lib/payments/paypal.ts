import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

const API_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getAccessToken(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`)
  }

  const data = await res.json()
  return data.access_token
}

export class PayPalProvider implements PaymentProvider {
  readonly name: ProviderName = 'paypal'

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const token = await getAccessToken()

    const dollarAmount = (params.priceInCents / 100).toFixed(2)
    let itemName: string
    let returnUrl: string
    let cancelUrl: string

    if (params.type === 'invoice' && params.invoiceId) {
      itemName = params.description || `Invoice Payment #${params.invoiceId.slice(0, 8)}`
      returnUrl = params.successUrl || `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/engagements?payment=success`
      cancelUrl = params.cancelUrl || `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/engagements?payment=cancelled`
    } else {
      itemName = params.description || (params.connectsAmount ? `${params.connectsAmount} Connects` : 'Payment')
      returnUrl = `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=success`
      cancelUrl = `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=cancelled`
    }

    const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.invoiceCurrency || 'USD',
              value: dollarAmount,
            },
            description: itemName,
            custom_id: params.orderId,
            invoice_id: params.orderId,
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl,
            },
          },
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`PayPal order creation failed: ${err}`)
    }

    const order = await res.json()
    const approvalLink = order.links?.find((l: { rel: string; href: string }) => l.rel === 'payer-action')?.href

    return {
      redirectUrl: approvalLink || `${API_BASE}/checkoutnow?token=${order.id}`,
      sessionId: order.id,
    }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const token = await getAccessToken()
    const res = await fetch(`${API_BASE}/v2/checkout/orders/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) return { verified: false }

    const order = await res.json()
    return {
      verified: order.status === 'COMPLETED',
      orderId: order.purchase_units?.[0]?.custom_id,
      providerOrderId: order.id,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const body = await request.text()
    let event
    try {
      event = JSON.parse(body)
    } catch {
      return { event: 'ignored' }
    }

    // PayPal webhook verification
    const verified = await this.verifyWebhookSignature(request, body)
    if (!verified) {
      return { event: 'ignored' }
    }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource?.custom_id || event.resource?.invoice_id
      if (orderId) {
        return {
          event: 'payment.completed',
          orderId,
          providerOrderId: event.resource?.id,
        }
      }
    }

    // Capture the order on CHECKOUT.ORDER.APPROVED
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = event.resource?.id
      if (orderId) {
        const token = await getAccessToken()
        const captureRes = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (captureRes.ok) {
          const capture = await captureRes.json()
          const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
          if (customId) {
            return {
              event: 'payment.completed',
              orderId: customId,
              providerOrderId: capture.id,
            }
          }
        }
      }
    }

    return { event: 'ignored' }
  }

  private async verifyWebhookSignature(request: Request, body: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) return true // skip verification if not configured

    try {
      const token = await getAccessToken()
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })

      const res = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      })

      const result = await res.json()
      return result.verification_status === 'SUCCESS'
    } catch {
      return false
    }
  }
}

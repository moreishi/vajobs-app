import { createHmac } from 'crypto'
import type { PaymentProvider, CreateCheckoutParams, CheckoutResult, VerifyResult, WebhookResult } from './types'
import type { ProviderName } from './types'

const API_BASE = process.env.MAYA_SANDBOX === 'true'
  ? 'https://pg-sandbox.paymaya.com'
  : 'https://api.paymaya.com'

export class MayaProvider implements PaymentProvider {
  readonly name: ProviderName = 'maya'

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const dollarAmount = (params.priceInCents / 100).toFixed(2)
    const publicKey = process.env.MAYA_PUBLIC_KEY!

    const res = await fetch(`${API_BASE}/checkout/v1/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${publicKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalAmount: {
          value: dollarAmount,
          currency: 'USD',
        },
        items: [
          {
            name: `${params.connectsAmount} Connects`,
            quantity: 1,
            totalAmount: {
              value: dollarAmount,
            },
          },
        ],
        redirectUrl: {
          success: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=success`,
          failure: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=failed`,
          cancel: `${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/connects?payment=cancelled`,
        },
        requestReferenceNumber: params.orderId,
        metadata: {
          userId: params.userId,
          orderId: params.orderId,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Maya checkout creation failed: ${err}`)
    }

    const data = await res.json()
    return {
      redirectUrl: data.redirectUrl,
      sessionId: data.checkoutId,
    }
  }

  async verifyPayment(sessionId: string): Promise<VerifyResult> {
    const secretKey = process.env.MAYA_SECRET_KEY!
    const res = await fetch(`${API_BASE}/checkout/v1/checkouts/${sessionId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      },
    })

    if (!res.ok) return { verified: false }

    const data = await res.json()
    return {
      verified: data.paymentStatus === 'PAYMENT_SUCCESS',
      orderId: data.requestReferenceNumber,
      providerOrderId: data.checkoutId,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const body = await request.text()
    const signature = request.headers.get('x-maya-signature')
    const secretKey = process.env.MAYA_SECRET_KEY

    if (secretKey && signature) {
      const expected = createHmac('sha256', secretKey).update(body).digest('hex')
      if (expected !== signature) {
        return { event: 'ignored' }
      }
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(body)
    } catch {
      return { event: 'ignored' }
    }

    const status = data.paymentStatus as string | undefined
    if (status === 'PAYMENT_SUCCESS') {
      const orderId =
        (data.requestReferenceNumber as string) ||
        ((data.metadata as Record<string, string>)?.orderId as string | undefined)
      if (orderId) {
        return {
          event: 'payment.completed',
          orderId,
          providerOrderId: data.checkoutId as string,
        }
      }
    }

    return { event: 'ignored' }
  }
}

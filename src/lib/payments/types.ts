export type ProviderName = 'stripe' | 'paypal' | 'hitpay' | 'xendit' | 'maya'

export type CheckoutType = 'connects' | 'subscription'

export interface CreateCheckoutParams {
  type?: CheckoutType
  connectsAmount?: number
  priceInCents: number
  userId: string
  orderId: string
  description?: string
  planId?: string
  metadata?: Record<string, string>
}

export interface CheckoutResult {
  redirectUrl: string
  sessionId: string
}

export interface VerifyResult {
  verified: boolean
  orderId?: string
  providerOrderId?: string
}

export interface WebhookResult {
  event: 'payment.completed' | 'payment.failed' | 'ignored'
  orderId?: string
  providerOrderId?: string
}

export interface PaymentProvider {
  readonly name: ProviderName
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
  verifyPayment(sessionId: string): Promise<VerifyResult>
  handleWebhook(request: Request): Promise<WebhookResult>
}

export const PROVIDER_NAMES: ProviderName[] = ['stripe', 'paypal', 'hitpay', 'xendit', 'maya']
export const PROVIDER_LABELS: Record<ProviderName, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  hitpay: 'HitPay',
  xendit: 'Xendit',
  maya: 'Maya',
}

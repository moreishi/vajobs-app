import { prisma } from '@/lib/prisma'
import type { ProviderName, PaymentProvider } from './types'
import { StripeProvider } from './stripe'
import { PayPalProvider } from './paypal'
import { HitPayProvider } from './hitpay'
import { XenditProvider } from './xendit'
import { MayaProvider } from './maya'

const providers: Record<ProviderName, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  paypal: () => new PayPalProvider(),
  hitpay: () => new HitPayProvider(),
  xendit: () => new XenditProvider(),
  maya: () => new MayaProvider(),
}

export function getProvider(name: ProviderName): PaymentProvider {
  const factory = providers[name]
  if (!factory) throw new Error(`Unknown payment provider: ${name}`)
  return factory()
}

export async function getActiveProvider(): Promise<{ name: ProviderName; instance: PaymentProvider }> {
  const setting = await prisma.paymentSetting.findUnique({
    where: { key: 'active_provider' },
  })
  const name = (setting?.value as ProviderName) || 'stripe'
  if (!providers[name]) throw new Error(`Unknown payment provider: ${name}`)
  return { name, instance: providers[name]() }
}

export function checkProviderConfigured(name: ProviderName): boolean {
  switch (name) {
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY
    case 'paypal':
      return !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET
    case 'hitpay':
      return !!process.env.HITPAY_API_KEY
    case 'xendit':
      return !!process.env.XENDIT_SECRET_KEY
    case 'maya':
      return !!process.env.MAYA_PUBLIC_KEY && !!process.env.MAYA_SECRET_KEY
  }
}

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/payments/registry'
import { CONNECT_PACKAGES } from '@/lib/constants'

export async function createConnectsCheckout(
  _prevState: { error?: string; redirectUrl?: string } | undefined,
  formData: FormData,
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const packageAmount = parseInt(formData.get('amount') as string)
  const pkg = CONNECT_PACKAGES.find((p) => p.amount === packageAmount)
  if (!pkg) return { error: 'Invalid package' }

  const orderId = crypto.randomUUID()

  try {
    const { name, instance } = await getActiveProvider()
    const { redirectUrl, sessionId } = await instance.createCheckout({
      connectsAmount: pkg.amount,
      priceInCents: pkg.price * 100,
      userId,
      orderId,
    })

    await prisma.paymentOrder.create({
      data: {
        id: orderId,
        userId,
        connectsAmount: pkg.amount,
        priceInCents: pkg.price * 100,
        provider: name,
        providerSessionId: sessionId,
        status: 'pending',
      },
    })

    return { redirectUrl }
  } catch (error) {
    // Mark order as failed if it was created
    await prisma.paymentOrder.update({
      where: { id: orderId },
      data: { status: 'failed' },
    }).catch(() => {})

    return { error: error instanceof Error ? error.message : 'Payment provider unavailable' }
  }
}

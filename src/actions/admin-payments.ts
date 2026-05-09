'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROVIDER_NAMES } from '@/lib/payments/types'
import type { ProviderName } from '@/lib/payments/types'

export async function updateActiveProvider(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const provider = formData.get('provider') as string
  if (!PROVIDER_NAMES.includes(provider as ProviderName)) {
    return { error: 'Invalid provider' }
  }

  await prisma.paymentSetting.upsert({
    where: { key: 'active_provider' },
    update: { value: provider },
    create: { key: 'active_provider', value: provider },
  })

  revalidatePath('/dashboard/admin/payments')
  return { success: true }
}

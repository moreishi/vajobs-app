import { prisma } from '@/lib/prisma'

export async function isMembershipEnabled(): Promise<boolean> {
  const setting = await prisma.paymentSetting.findUnique({
    where: { key: 'memberships_enabled' },
  })
  return setting?.value !== 'false'
}

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES, CONNECT_PACKAGES } from '@/lib/constants'

export async function purchaseConnects(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  const packageAmount = parseInt(formData.get('amount') as string)
  const pkg = CONNECT_PACKAGES.find((p) => p.amount === packageAmount)
  if (!pkg) return { error: 'Invalid package' }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { connects: { increment: pkg.amount } },
    })
    await tx.connectTransaction.create({
      data: {
        userId,
        amount: pkg.amount,
        type: 'purchase',
        description: `Purchased ${pkg.amount} connects for $${pkg.price}`,
      },
    })
  })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function getConnectHistory(page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user?.id) return { transactions: [], total: 0 }

  const [transactions, total] = await Promise.all([
    prisma.connectTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.connectTransaction.count({ where: { userId: session.user.id } }),
  ])

  return { transactions, total }
}

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getAllEngagements({
  status = '',
  page = 1,
  pageSize = 20,
}: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { engagements: [], total: 0 }

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [engagements, total] = await Promise.all([
    prisma.engagement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        talent: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        jobPost: { select: { id: true, title: true } },
      },
    }),
    prisma.engagement.count({ where }),
  ])

  return { engagements, total }
}

export async function endEngagement(engagementId: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { status: 'ended', endDate: new Date() },
  })
  revalidatePath('/dashboard/admin/engagements')
  return { success: true }
}

import { prisma } from '@/lib/prisma'

export async function closeExpiredJobs() {
  const now = new Date()

  const result = await prisma.jobPost.updateMany({
    where: {
      status: 'open',
      expiresAt: { lte: now },
    },
    data: { status: 'closed' },
  })

  return { closed: result.count }
}

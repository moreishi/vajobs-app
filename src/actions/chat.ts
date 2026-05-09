'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getMessages(applicationId: string, since?: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { applicantId: true, jobPost: { select: { posterId: true } } },
  })
  if (!application) return []

  const isParticipant =
    application.applicantId === session.user.id ||
    application.jobPost.posterId === session.user.id
  if (!isParticipant) return []

  const messages = await prisma.message.findMany({
    where: {
      conversation: { applicationId },
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))
}

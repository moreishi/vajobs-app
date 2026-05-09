'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveJob(jobPostId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobPostId: { userId: session.user.id, jobPostId } },
  })
  if (existing) return { error: 'Job already saved' }

  await prisma.savedJob.create({
    data: { userId: session.user.id, jobPostId },
  })

  revalidatePath(`/jobs/${jobPostId}`)
  return { success: true }
}

export async function unsaveJob(jobPostId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.savedJob.deleteMany({
    where: { userId: session.user.id, jobPostId },
  })

  revalidatePath(`/jobs/${jobPostId}`)
  return { success: true }
}

export async function getSavedJobIds() {
  const session = await auth()
  if (!session?.user?.id) return []

  const saved = await prisma.savedJob.findMany({
    where: { userId: session.user.id },
    select: { jobPostId: true },
  })

  return saved.map((s) => s.jobPostId)
}

export async function getSavedJobs() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.savedJob.findMany({
    where: { userId: session.user.id },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          type: true,
          location: true,
          salaryRange: true,
          shortDescription: true,
          skills: true,
          status: true,
          posterName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

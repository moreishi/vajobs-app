'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export async function createReview(applicationId: string, formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can leave reviews' }
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true, title: true } } },
  })
  if (!application) return { error: 'Application not found' }
  if (application.jobPost.posterId !== userId) return { error: 'Only the job poster can review this talent' }
  if (application.status !== 'accepted') return { error: 'Can only review after hiring' }

  const existing = await prisma.review.findUnique({ where: { applicationId } })
  if (existing) return { error: 'You have already reviewed this talent' }

  const rating = parseInt(formData.get('rating') as string)
  if (isNaN(rating) || rating < 1 || rating > 5) return { error: 'Rating must be between 1 and 5' }

  const comment = (formData.get('comment') as string)?.trim() || null

  await prisma.review.create({
    data: {
      applicationId,
      reviewerId: userId,
      revieweeId: application.applicantId,
      rating,
      comment,
    },
  })

  await createNotification({
    userId: application.applicantId,
    type: 'review_received',
    title: 'New Review',
    body: `You received a ${rating}-star review for your work on "${application.jobPost.title}"`,
    link: ROUTES.TALENT_DETAIL(application.applicantId),
  })

  revalidatePath(ROUTES.TALENT_DETAIL(application.applicantId))
  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true }
}

export async function getReviews(talentId: string) {
  return prisma.review.findMany({
    where: { revieweeId: talentId },
    include: {
      reviewer: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTalentRating(talentId: string) {
  const result = await prisma.review.aggregate({
    where: { revieweeId: talentId },
    _avg: { rating: true },
    _count: true,
  })
  return {
    average: result._avg.rating ?? 0,
    count: result._count,
  }
}

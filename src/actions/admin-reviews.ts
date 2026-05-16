'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getAllReviews({
  page = 1,
  pageSize = 20,
}: {
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { reviews: [], total: 0 }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        reviewee: { select: { id: true, name: true, email: true } },
        application: {
          select: { jobPost: { select: { id: true, title: true } } },
        },
      },
    }),
    prisma.review.count(),
  ])

  return { reviews, total }
}

export async function deleteReview(reviewId: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }

  await prisma.review.delete({ where: { id: reviewId } })
  revalidatePath('/dashboard/admin/reviews')
  return { success: true }
}

export async function getReviewStats() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null

  const [totalReviews, avgRating, ratingDist] = await Promise.all([
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.groupBy({
      by: ['rating'],
      _count: true,
    }),
  ])

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of ratingDist) {
    distribution[r.rating] = r._count
  }

  return {
    totalReviews,
    averageRating: avgRating._avg.rating ?? 0,
    distribution,
  }
}

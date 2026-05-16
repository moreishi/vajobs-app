'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/reviews/star-rating'
import { deleteReview } from '@/actions/admin-reviews'

type ReviewWithRelations = {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  reviewer: { id: string; name: string | null; email: string }
  reviewee: { id: string; name: string | null; email: string }
  application: { jobPost: { id: string; title: string } }
}

export function ReviewsTable({ reviews }: { reviews: ReviewWithRelations[] }) {
  const router = useRouter()
  const [pendingId, startDelete] = useTransition()

  function handleDelete(reviewId: string) {
    if (!confirm('Delete this review? This cannot be undone.')) return
    startDelete(async () => {
      await deleteReview(reviewId)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px] divide-y">
        <div className="grid grid-cols-12 gap-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="col-span-2">Reviewer</span>
          <span className="col-span-2">Reviewee</span>
          <span className="col-span-2">Job</span>
          <span className="col-span-1">Rating</span>
          <span className="col-span-3">Comment</span>
          <span className="col-span-1">Date</span>
          <span className="col-span-1"></span>
        </div>
        {reviews.map((review) => (
          <div key={review.id} className="grid grid-cols-12 gap-4 py-3 text-sm">
            <div className="col-span-2 truncate">
              {review.reviewer.name || review.reviewer.email}
            </div>
            <div className="col-span-2 truncate">
              {review.reviewee.name || review.reviewee.email}
            </div>
            <div className="col-span-2 truncate text-muted-foreground">
              {review.application.jobPost.title}
            </div>
            <div className="col-span-1">
              <StarRating rating={review.rating} size="sm" />
            </div>
            <div className="col-span-3 truncate text-muted-foreground">
              {review.comment || <span className="italic">No comment</span>}
            </div>
            <div className="col-span-1 text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
            <div className="col-span-1">
              <button
                onClick={() => handleDelete(review.id)}
                disabled={pendingId === review.id}
                className="text-xs text-destructive hover:underline disabled:opacity-50"
              >
                {pendingId === review.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

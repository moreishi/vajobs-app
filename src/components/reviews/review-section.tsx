import { StarRating } from './star-rating'
import { ReviewCard } from './review-card'

type ReviewSectionProps = {
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    reviewer: {
      name: string | null
      email: string
      image: string | null
    }
  }>
  rating: { average: number; count: number }
}

export function ReviewSection({ reviews, rating }: ReviewSectionProps) {
  // Calculate rating distribution
  const distribution = [0, 0, 0, 0, 0]
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[5 - r.rating]++
    }
  }
  const maxCount = Math.max(...distribution, 1)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {rating.count > 0 && (
          <div className="mt-2 flex flex-wrap items-start gap-6">
            {/* Average score */}
            <div className="text-center">
              <p className="text-3xl font-bold">{rating.average.toFixed(1)}</p>
              <StarRating rating={Math.round(rating.average)} size="md" />
              <p className="mt-1 text-xs text-muted-foreground">{rating.count} review{rating.count !== 1 ? 's' : ''}</p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1 min-w-[140px]">
              {distribution.map((count, i) => {
                const star = 5 - i
                const pct = (count / maxCount) * 100
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-right text-muted-foreground">{star}★</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}

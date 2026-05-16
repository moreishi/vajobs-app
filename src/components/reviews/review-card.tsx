import { StarRating } from './star-rating'

type ReviewCardProps = {
  review: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    reviewer: {
      name: string | null
      email: string
      image: string | null
    }
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {review.reviewer.image ? (
                <img src={review.reviewer.image} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                (review.reviewer.name?.[0]?.toUpperCase() || review.reviewer.email[0].toUpperCase())
              )}
            </div>
            <span className="text-sm font-medium">{review.reviewer.name || review.reviewer.email}</span>
          </div>
          <div className="mt-1">
            <StarRating rating={review.rating} size="sm" />
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
      )}
    </div>
  )
}

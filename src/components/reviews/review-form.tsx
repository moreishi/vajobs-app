'use client'

import { useState } from 'react'
import { createReview } from '@/actions/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function ReviewForm({ applicationId }: { applicationId: string }) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createReview(applicationId, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Review</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-400">Thank you! Your review has been submitted.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Leave a Review</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="text-2xl transition-colors hover:scale-110"
                >
                  <input type="radio" name="rating" value={star} checked={rating === star} onChange={() => {}} className="sr-only" />
                  <span className={star <= (hoveredStar || rating) ? 'text-yellow-500' : 'text-muted-foreground/30'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="mb-1 block text-sm font-medium">Comment (optional)</label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="Share your experience working with this talent..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading || rating === 0}>
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

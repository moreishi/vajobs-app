import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { deleteReview, getAllReviews, getReviewStats } from '@/actions/admin-reviews'
import { ReviewsTable } from './reviews-table'
import { StarRating } from '@/components/reviews/star-rating'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const [{ reviews, total }, stats] = await Promise.all([
    getAllReviews({ page: currentPage }),
    getReviewStats(),
  ])

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Review Management</h1>

      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalReviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <div className="mt-1">
                <StarRating rating={Math.round(stats.averageRating)} size="sm" />
              </div>
            </CardContent>
          </Card>
          {[5, 4, 3, 2, 1].map((star) => (
            <Card key={star}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{star} Star{star !== 1 ? 's' : ''}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.distribution[star]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <ReviewsTable reviews={reviews} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
              <p className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/dashboard/admin/reviews?page=${currentPage - 1}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/dashboard/admin/reviews?page=${currentPage + 1}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

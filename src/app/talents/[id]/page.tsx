import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicHeader } from '@/components/layout/public-header'

export const metadata = {
  title: 'Talent Profile - VA Jobs Online',
}

export const dynamic = 'force-dynamic'

export default async function TalentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const isLoggedIn = !!session?.user

  const { getProfile } = await import('@/actions/profile')
  const profile = await getProfile(id)

  if (!profile) {
    notFound()
  }

  const { getReviews, getTalentRating } = await import('@/actions/reviews')
  const [reviews, rating] = await Promise.all([
    getReviews(id),
    getTalentRating(id),
  ])

  const availabilityColor =
    profile.availability === 'available'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : profile.availability === 'busy'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/talents"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          &larr; Back to talents
        </Link>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold">{profile.user.name || profile.user.email}</h1>
                    {profile.headline && (
                      <p className="mt-1 text-lg text-muted-foreground">{profile.headline}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {profile.hourlyRate && <span>${profile.hourlyRate}/hr</span>}
                      {profile.experience && <span>{profile.experience} years experience</span>}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${availabilityColor}`}>
                        {profile.availability}
                      </span>
                    </div>
                  </div>
                  {profile.resumeUrl && (
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download Resume
                    </a>
                  )}
                </div>
              </div>
            </div>

            {profile.skills.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">Skills</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">About</h2>
                <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {profile.bio}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <div className="mt-8">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {rating.count > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="text-yellow-500">{'★'.repeat(Math.round(rating.average))}{'☆'.repeat(5 - Math.round(rating.average))}</span>
                {rating.average.toFixed(1)} ({rating.count})
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {review.reviewer.name?.[0]?.toUpperCase() || review.reviewer.email[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{review.reviewer.name || review.reviewer.email}</span>
                        </div>
                        <div className="mt-1 text-yellow-500 text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

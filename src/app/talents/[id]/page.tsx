import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicHeader } from '@/components/layout/public-header'
import { PortfolioGallery } from '@/components/portfolio/portfolio-gallery'
import { TalentBadge } from '@/components/talents/talent-badge'
import { ReviewSection } from '@/components/reviews/review-section'
import { computeBadges, type BadgeOptions } from '@/lib/badges'

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
  const { getPortfolioItems } = await import('@/actions/portfolio')
  const [reviews, rating, portfolioItems, vaSubscription] = await Promise.all([
    getReviews(id),
    getTalentRating(id),
    getPortfolioItems(id),
    prisma.vaSubscription.findFirst({
      where: { userId: id, status: 'active' },
      include: { plan: true },
    }),
  ])

  const badgeOptions: BadgeOptions = {
    rating: rating.count > 0 ? { average: rating.average, count: rating.count } : undefined,
    hasPremium: !!vaSubscription,
  }
  const badges = computeBadges(profile, badgeOptions)

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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold overflow-hidden">
                {profile.user.image ? (
                  <img src={profile.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold">{profile.user.name || profile.user.email}</h1>
                    </div>
                    {badges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {badges.map((badge) => (
                          <TalentBadge key={badge.type} type={badge.type} size="md" />
                        ))}
                      </div>
                    )}
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

        {/* Portfolio */}
        {portfolioItems.length > 0 && (
          <div className="mt-8">
            <PortfolioGallery items={portfolioItems} />
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <ReviewSection reviews={reviews} rating={rating} />
        </div>
      </main>
    </div>
  )
}

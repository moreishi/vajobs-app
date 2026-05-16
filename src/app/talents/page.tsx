import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { TalentSearch } from '@/components/talents/talent-search'
import { TalentBadge } from '@/components/talents/talent-badge'
import { SaveSearchButton } from '@/components/saved-searches/save-search-button'
import { Pagination } from '@/components/pagination'
import { PublicHeader } from '@/components/layout/public-header'
import { computeBadges } from '@/lib/badges'
import type { Profile, Availability } from '@/types'

export const metadata = {
  title: 'Browse Talents - Talent Hub',
  description: 'Find talented professionals for your projects',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; skills?: string; availability?: string; rateMin?: string; rateMax?: string; expMin?: string; expMax?: string; sort?: string; page?: string }>
}) {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const { searchTalents } = await import('@/actions/profile')
  const { profiles, total } = await searchTalents({
    query: params.query,
    skills: params.skills,
    availability: params.availability,
    rateMin: params.rateMin,
    rateMax: params.rateMax,
    expMin: params.expMin,
    expMax: params.expMax,
    sort: params.sort,
    page: currentPage,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const paginationParams: Record<string, string> = {}
  if (params.query) paginationParams.query = params.query
  if (params.skills) paginationParams.skills = params.skills
  if (params.availability) paginationParams.availability = params.availability
  if (params.rateMin) paginationParams.rateMin = params.rateMin
  if (params.rateMax) paginationParams.rateMax = params.rateMax
  if (params.expMin) paginationParams.expMin = params.expMin
  if (params.expMax) paginationParams.expMax = params.expMax
  if (params.sort) paginationParams.sort = params.sort

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/20 to-background">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Browse Talents</h1>
          <p className="mt-2 text-muted-foreground">
            Find skilled professionals for your projects
          </p>
        </div>

        <div className="mb-8">
          <TalentSearch
            initialQuery={params.query || ''}
            initialSkills={params.skills || ''}
            initialAvailability={params.availability || ''}
            initialRateMin={params.rateMin || ''}
            initialRateMax={params.rateMax || ''}
            initialExpMin={params.expMin || ''}
            initialExpMax={params.expMax || ''}
            initialSort={params.sort || ''}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{total} talent{total !== 1 ? 's' : ''} found</p>
          {isLoggedIn && (
            <SaveSearchButton type="talents" searchParams={new URLSearchParams(paginationParams).toString()} />
          )}
        </div>

        {profiles.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile: any) => {
                const badges = computeBadges(profile)
                return (
                  <Link
                    key={profile.id}
                    href={`/talents/${profile.userId}`}
                    className="block transition-all hover:opacity-80"
                  >
                    <Card className="h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium overflow-hidden">
                            {profile.user.image ? (
                              <img src={profile.user.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold">{profile.user.name || profile.user.email}</p>
                              {profile.verified && (
                                <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  <svg className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                  Verified
                                </span>
                              )}
                            </div>
                            {profile.headline && (
                              <p className="truncate text-sm text-muted-foreground">{profile.headline}</p>
                            )}
                            {badges.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {badges.map((badge) => (
                                  <TalentBadge key={badge.type} type={badge.type} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {profile.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {profile.skills.slice(0, 5).map((skill: string) => (
                              <span
                                key={skill}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 5 && (
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                +{profile.skills.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {profile.hourlyRate && (
                            <span>${profile.hourlyRate}/hr</span>
                          )}
                          {profile.experience && (
                            <span>{profile.experience} yr exp</span>
                          )}
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            profile.availability === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : profile.availability === 'busy'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {profile.availability}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/talents"
              params={paginationParams}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">No profiles match your search.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

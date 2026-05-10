import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { TalentSearch } from '@/components/talents/talent-search'
import { Pagination } from '@/components/pagination'
import { PublicHeader } from '@/components/layout/public-header'
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
    <div className="flex min-h-screen flex-col">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
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

        {profiles.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile: any) => (
                <Link
                  key={profile.id}
                  href={`/talents/${profile.userId}`}
                  className="block transition-all hover:opacity-80"
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {profile.user.name?.[0]?.toUpperCase() || profile.user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{profile.user.name || profile.user.email}</p>
                          {profile.headline && (
                            <p className="truncate text-sm text-muted-foreground">{profile.headline}</p>
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
              ))}
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

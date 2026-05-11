import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobCard } from '@/components/jobs/job-card'
import { JobSearch } from '@/components/jobs/job-search'
import { SaveSearchButton } from '@/components/saved-searches/save-search-button'
import { Pagination } from '@/components/pagination'
import { PublicHeader } from '@/components/layout/public-header'
import type { JobPost, JobType, JobStatus } from '@/types'

export const metadata = {
  title: 'Browse Jobs - Talent Hub',
  description: 'Browse open positions and find your next opportunity',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; type?: string; skills?: string; location?: string; sort?: string; page?: string }>
}) {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const where: Record<string, unknown> = { status: 'open' }

  if (params.type) {
    where.type = params.type
  }

  if (params.query) {
    where.OR = [
      { title: { contains: params.query } },
      { description: { contains: params.query } },
      { shortDescription: { contains: params.query } },
    ]
  }

  if (params.skills) {
    const skillFilters = params.skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (skillFilters.length > 0) {
      where.AND = skillFilters.map((skill) => ({
        skills: { contains: skill },
      }))
    }
  }

  if (params.location) {
    where.location = { contains: params.location }
  }

  const orderBy = params.sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const }

  const [total, prismaJobs] = await Promise.all([
    prisma.jobPost.count({ where }),
    prisma.jobPost.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const jobs: JobPost[] = prismaJobs.map(j => ({
    id: j.id,
    title: j.title,
    description: j.description,
    short_description: j.shortDescription,
    location: j.location,
    type: j.type as JobType,
    salary_range: j.salaryRange,
    skills: JSON.parse(j.skills) as string[],
    status: j.status as JobStatus,
    poster_id: j.posterId,
    poster_name: j.posterName,
    created_at: j.createdAt.toISOString(),
    updated_at: j.updatedAt.toISOString(),
  }))

  const paginationParams: Record<string, string> = {}
  if (params.query) paginationParams.query = params.query
  if (params.type) paginationParams.type = params.type
  if (params.skills) paginationParams.skills = params.skills
  if (params.location) paginationParams.location = params.location
  if (params.sort) paginationParams.sort = params.sort

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/20 to-background">
      <PublicHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Browse Jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Find your next opportunity
          </p>
        </div>

        <div className="mb-8">
          <JobSearch
            initialQuery={params.query || ''}
            initialType={params.type || ''}
            initialSkills={params.skills || ''}
            initialLocation={params.location || ''}
            initialSort={params.sort || ''}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{total} job{total !== 1 ? 's' : ''} found</p>
          {isLoggedIn && (
            <SaveSearchButton type="jobs" searchParams={new URLSearchParams(paginationParams).toString()} />
          )}
        </div>

        {jobs.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job as JobPost} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/jobs"
              params={paginationParams}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">No open positions match your search.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </main>
    </div>
  )
}

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    savedJob: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let saveJob: typeof import('@/actions/saved-jobs').saveJob
let unsaveJob: typeof import('@/actions/saved-jobs').unsaveJob
let getSavedJobIds: typeof import('@/actions/saved-jobs').getSavedJobIds
let getSavedJobs: typeof import('@/actions/saved-jobs').getSavedJobs

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/saved-jobs')
  saveJob = mod.saveJob
  unsaveJob = mod.unsaveJob
  getSavedJobIds = mod.getSavedJobIds
  getSavedJobs = mod.getSavedJobs
})

describe('saveJob', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await saveJob('job-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when job already saved', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.savedJob.findUnique).mockResolvedValueOnce({ id: 'saved-id' } as any)

    const result = await saveJob('job-id')

    expect(result).toEqual({ error: 'Job already saved' })
    expect(prisma.savedJob.create).not.toHaveBeenCalled()
  })

  it('saves job successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.savedJob.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.savedJob.create).mockResolvedValueOnce({} as any)

    const result = await saveJob('job-id')

    expect(prisma.savedJob.create).toHaveBeenCalledWith({
      data: { userId: 'user-id', jobPostId: 'job-id' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('unsaveJob', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await unsaveJob('job-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('removes saved job', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.savedJob.deleteMany).mockResolvedValueOnce({ count: 1 })

    const result = await unsaveJob('job-id')

    expect(prisma.savedJob.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', jobPostId: 'job-id' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('getSavedJobIds', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getSavedJobIds()
    expect(result).toEqual([])
  })

  it('returns list of saved job IDs', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.savedJob.findMany).mockResolvedValueOnce([
      { jobPostId: 'job-1' },
      { jobPostId: 'job-2' },
    ] as any)

    const result = await getSavedJobIds()

    expect(result).toEqual(['job-1', 'job-2'])
  })

  it('returns empty array when no saved jobs', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.savedJob.findMany).mockResolvedValueOnce([])

    const result = await getSavedJobIds()
    expect(result).toEqual([])
  })
})

describe('getSavedJobs', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getSavedJobs()
    expect(result).toEqual([])
  })

  it('returns saved jobs with job details', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    const mockSaved = [
      {
        id: 'saved-1',
        userId: 'user-id',
        jobPostId: 'job-1',
        createdAt: new Date(),
        jobPost: {
          id: 'job-1',
          title: 'Software Engineer',
          type: 'full-time',
          location: 'Remote',
          salaryRange: '$100k',
          shortDescription: 'Great job',
          skills: '["React"]',
          status: 'open',
          posterName: 'Client',
          createdAt: new Date(),
        },
      },
    ]
    vi.mocked(prisma.savedJob.findMany).mockResolvedValueOnce(mockSaved)

    const result = await getSavedJobs()

    expect(prisma.savedJob.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      include: {
        jobPost: {
          select: {
            id: true,
            title: true,
            type: true,
            location: true,
            salaryRange: true,
            shortDescription: true,
            skills: true,
            status: true,
            posterName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual(mockSaved)
  })
})

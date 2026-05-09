import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn() },
    review: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
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

let createReview: typeof import('@/actions/reviews').createReview
let getReviews: typeof import('@/actions/reviews').getReviews
let getTalentRating: typeof import('@/actions/reviews').getTalentRating

const mockClientUser = { id: 'client-id', role: 'client' }
const mockTalentUser = { id: 'talent-id', role: 'talent' }
const mockAdminUser = { id: 'admin-id', role: 'admin' }

const mockApplication = {
  id: 'app-id',
  jobPostId: 'job-id',
  applicantId: 'talent-id',
  status: 'accepted',
  jobPost: { posterId: 'client-id', title: 'Test Job' },
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/reviews')
  createReview = mod.createReview
  getReviews = mod.getReviews
  getTalentRating = mod.getTalentRating
})

describe('createReview', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when role is not client or admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockTalentUser } as any)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'Only clients can leave reviews' })
  })

  it('returns error when application not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'Application not found' })
  })

  it('returns error when not the job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id', role: 'client' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'Only the job poster can review this talent' })
  })

  it('returns error when status is not accepted', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      status: 'rejected',
    } as any)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'Can only review after hiring' })
  })

  it('returns error when review already exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce({ id: 'existing-review' } as any)
    const result = await createReview('app-id', new FormData())
    expect(result).toEqual({ error: 'You have already reviewed this talent' })
  })

  it('returns error for rating below 1', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('rating', '0')
    const result = await createReview('app-id', formData)
    expect(result).toEqual({ error: 'Rating must be between 1 and 5' })
  })

  it('returns error for rating above 5', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('rating', '6')
    const result = await createReview('app-id', formData)
    expect(result).toEqual({ error: 'Rating must be between 1 and 5' })
  })

  it('returns error for non-numeric rating', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('rating', 'abc')
    const result = await createReview('app-id', formData)
    expect(result).toEqual({ error: 'Rating must be between 1 and 5' })
  })

  it('creates review successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.review.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('rating', '5')
    formData.set('comment', 'Excellent work!')

    const result = await createReview('app-id', formData)

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        applicationId: 'app-id',
        reviewerId: 'client-id',
        revieweeId: 'talent-id',
        rating: 5,
        comment: 'Excellent work!',
      },
    })
    expect(result).toEqual({ success: true })
  })

  it('creates review without comment', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: mockClientUser } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.review.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('rating', '4')

    const result = await createReview('app-id', formData)

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        applicationId: 'app-id',
        reviewerId: 'client-id',
        revieweeId: 'talent-id',
        rating: 4,
        comment: null,
      },
    })
    expect(result).toEqual({ success: true })
  })

  it('allows admin to create review', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { ...mockAdminUser, id: 'admin-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'admin-id', title: 'Test Job' },
    } as any)
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.review.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('rating', '3')

    const result = await createReview('app-id', formData)

    expect(result).toEqual({ success: true })
  })
})

describe('getReviews', () => {
  it('returns reviews for a talent', async () => {
    const mockReviews = [
      {
        id: 'review-1',
        applicationId: 'app-id',
        reviewerId: 'client-id',
        revieweeId: 'talent-id',
        rating: 5,
        comment: 'Great work!',
        createdAt: new Date(),
        reviewer: { id: 'client-id', name: 'Client', email: 'client@example.com', image: null },
      },
    ]
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce(mockReviews)

    const result = await getReviews('talent-id')

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { revieweeId: 'talent-id' },
      include: {
        reviewer: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual(mockReviews)
  })

  it('returns empty array when no reviews', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([])
    const result = await getReviews('talent-id')
    expect(result).toEqual([])
  })
})

describe('getTalentRating', () => {
  it('returns average rating and count', async () => {
    vi.mocked(prisma.review.aggregate).mockResolvedValueOnce({
      _avg: { rating: 4.5 },
      _count: 10,
    } as any)

    const result = await getTalentRating('talent-id')

    expect(prisma.review.aggregate).toHaveBeenCalledWith({
      where: { revieweeId: 'talent-id' },
      _avg: { rating: true },
      _count: true,
    })
    expect(result).toEqual({ average: 4.5, count: 10 })
  })

  it('returns zero average when no reviews', async () => {
    vi.mocked(prisma.review.aggregate).mockResolvedValueOnce({
      _avg: { rating: null },
      _count: 0,
    } as any)

    const result = await getTalentRating('talent-id')

    expect(result).toEqual({ average: 0, count: 0 })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    engagement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  ROUTES: {
    ENGAGEMENTS: '/dashboard/engagements',
    ENGAGEMENT_DETAIL: (id: string) => `/dashboard/engagements/${id}`,
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let getEngagements: typeof import('@/actions/engagements').getEngagements
let getEngagementById: typeof import('@/actions/engagements').getEngagementById
let endEngagement: typeof import('@/actions/engagements').endEngagement

const mockEngagement = {
  id: 'engagement-id',
  applicationId: 'app-id',
  talentId: 'talent-id',
  clientId: 'client-id',
  jobPostId: 'job-id',
  status: 'active',
  startDate: new Date(),
  rate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  jobPost: { id: 'job-id', title: 'Test Job' },
  talent: { id: 'talent-id', name: 'Talent User', email: 'talent@example.com' },
  client: { id: 'client-id', name: 'Client User', email: 'client@example.com' },
}

const mockEngagementDetail = {
  ...mockEngagement,
  jobPost: { id: 'job-id', title: 'Test Job', description: 'A test job', salaryRange: '$100k', type: 'full-time' },
  application: { id: 'app-id', coverLetter: 'I am a great fit!', review: null },
  contract: null,
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/engagements')
  getEngagements = mod.getEngagements
  getEngagementById = mod.getEngagementById
  endEngagement = mod.endEngagement
})

describe('getEngagements', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getEngagements('talent-id', 'talent')
    expect(result).toEqual([])
  })

  it('returns engagements for talent with default active status', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.engagement.findMany).mockResolvedValueOnce([mockEngagement])

    const result = await getEngagements('talent-id', 'talent')

    expect(prisma.engagement.findMany).toHaveBeenCalledWith({
      where: { talentId: 'talent-id', status: 'active' },
      include: {
        jobPost: { select: { id: true, title: true } },
        talent: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('engagement-id')
  })

  it('returns engagements for client with default active status', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.engagement.findMany).mockResolvedValueOnce([mockEngagement])

    const result = await getEngagements('client-id', 'client')

    expect(prisma.engagement.findMany).toHaveBeenCalledWith({
      where: { clientId: 'client-id', status: 'active' },
      include: {
        jobPost: { select: { id: true, title: true } },
        talent: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    })
    expect(result).toHaveLength(1)
  })

  it('returns engagements with ended status filter', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    const endedEngagement = { ...mockEngagement, status: 'ended' }
    vi.mocked(prisma.engagement.findMany).mockResolvedValueOnce([endedEngagement])

    const result = await getEngagements('talent-id', 'talent', 'ended')

    expect(prisma.engagement.findMany).toHaveBeenCalledWith({
      where: { talentId: 'talent-id', status: 'ended' },
      include: expect.any(Object),
      orderBy: { startDate: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('ended')
  })

  it('returns empty array when no engagements found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.engagement.findMany).mockResolvedValueOnce([])

    const result = await getEngagements('talent-id', 'talent')
    expect(result).toEqual([])
  })
})

describe('getEngagementById', () => {
  it('returns null when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getEngagementById('engagement-id')
    expect(result).toBeNull()
  })

  it('returns null when engagement not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(null)
    const result = await getEngagementById('engagement-id')
    expect(result).toBeNull()
  })

  it('returns null when user is not a participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagementDetail)
    const result = await getEngagementById('engagement-id')
    expect(result).toBeNull()
  })

  it('returns engagement for talent participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagementDetail)

    const result = await getEngagementById('engagement-id')

    expect(prisma.engagement.findUnique).toHaveBeenCalledWith({
      where: { id: 'engagement-id' },
      include: {
        jobPost: { select: { id: true, title: true, description: true, salaryRange: true, type: true } },
        talent: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        application: { select: { id: true, coverLetter: true, review: true } },
        contract: {
          include: {
            invoices: { orderBy: { createdAt: 'desc' } },
            milestones: { orderBy: { createdAt: 'asc' } },
            client: { select: { id: true, name: true, email: true } },
            talent: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })
    expect(result).not.toBeNull()
    expect(result!.id).toBe('engagement-id')
    expect(result!.jobPost.title).toBe('Test Job')
  })

  it('returns engagement for client participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagementDetail)

    const result = await getEngagementById('engagement-id')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('engagement-id')
  })
})

describe('endEngagement', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await endEngagement('engagement-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when engagement not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(null)
    const result = await endEngagement('engagement-id')
    expect(result).toEqual({ error: 'Engagement not found' })
  })

  it('returns error when not the client', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagementDetail)
    const result = await endEngagement('engagement-id')
    expect(result).toEqual({ error: 'Only the client can end an engagement' })
  })

  it('returns error when engagement already ended', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce({
      ...mockEngagementDetail,
      status: 'ended',
    })
    const result = await endEngagement('engagement-id')
    expect(result).toEqual({ error: 'Engagement is already ended' })
  })

  it('ends engagement successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagementDetail)
    vi.mocked(prisma.engagement.update).mockResolvedValueOnce({ ...mockEngagementDetail, status: 'ended', endDate: new Date() })

    const { revalidatePath } = await import('next/cache')
    const result = await endEngagement('engagement-id')

    expect(prisma.engagement.update).toHaveBeenCalledWith({
      where: { id: 'engagement-id' },
      data: { status: 'ended', endDate: expect.any(Date) },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ success: true })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    jobPost: { findUnique: vi.fn() },
    application: { findMany: vi.fn(), count: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    engagement: { findUnique: vi.fn(), create: vi.fn() },
    contract: { create: vi.fn() },
    milestone: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let getJobProposals: typeof import('@/actions/proposals').getJobProposals
let acceptProposal: typeof import('@/actions/proposals').acceptProposal

const mockClientSession = { user: { id: 'client-id', role: 'client' } }
const mockTalentSession = { user: { id: 'talent-id', role: 'talent' } }

const mockJob = {
  id: 'job-id',
  title: 'Senior VA',
  posterId: 'client-id',
  status: 'open',
}

const mockApplications = [
  {
    id: 'app-1',
    applicantId: 'talent-1',
    applicantName: 'Talent One',
    applicantEmail: 'talent1@example.com',
    coverLetter: 'I am a great fit for this role.',
    status: 'pending',
    biddingConnects: 15,
    bidAmount: 2000,
    bidType: 'fixed',
    timeline: 30,
    approach: 'I will follow a structured approach.',
    createdAt: new Date(),
  },
  {
    id: 'app-2',
    applicantId: 'talent-2',
    applicantName: 'Talent Two',
    applicantEmail: 'talent2@example.com',
    coverLetter: 'Experienced VA here.',
    status: 'reviewed',
    biddingConnects: 20,
    bidAmount: 1500,
    bidType: 'fixed',
    timeline: 45,
    approach: 'Agile methodology.',
    createdAt: new Date(),
  },
]

beforeEach(async () => {
  vi.clearAllMocks()
  const proposalsMod = await import('@/actions/proposals')
  getJobProposals = proposalsMod.getJobProposals
  acceptProposal = proposalsMod.acceptProposal
})

describe('getJobProposals', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getJobProposals('job-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when job not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClientSession as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(null)
    const result = await getJobProposals('job-id')
    expect(result).toEqual({ error: 'Job not found' })
  })

  it('returns error when user is not the job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalentSession as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    const result = await getJobProposals('job-id')
    expect(result).toEqual({ error: 'Only the job poster can view proposals' })
  })

  it('returns proposals for the job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClientSession as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.application.findMany).mockResolvedValueOnce(
      mockApplications.map((app) => ({
        ...app,
        applicant: { id: app.applicantId, name: app.applicantName, email: app.applicantEmail },
      })) as any,
    )

    const result = await getJobProposals('job-id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0].applicantName).toBe('Talent One')
      expect(result.data[0].bidAmount).toBe(2000)
    }
  })

  it('returns empty array when no proposals exist', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClientSession as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.application.findMany).mockResolvedValueOnce([])

    const result = await getJobProposals('job-id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })
})

describe('acceptProposal', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await acceptProposal('app-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when talent tries to accept', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalentSession as any)
    const result = await acceptProposal('app-1')
    expect(result).toEqual({ error: 'Only clients can accept proposals' })
  })

  it('returns error when application already accepted', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClientSession as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app-1',
      status: 'accepted',
      applicantId: 'talent-1',
      jobPostId: 'job-id',
      jobPost: { posterId: 'client-id', title: 'Senior VA' },
    } as any)

    const result = await acceptProposal('app-1')
    expect(result).toEqual({ error: 'Proposal already accepted' })
  })

  it('successfully accepts a proposal and creates engagement', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClientSession as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app-1',
      status: 'pending',
      applicantId: 'talent-1',
      jobPostId: 'job-id',
      bidAmount: 2000,
      bidType: 'fixed',
      timeline: 30,
      approach: 'I will do the work.',
      coverLetter: 'I am a great fit.',
      jobPost: { posterId: 'client-id', title: 'Senior VA', description: 'A great role' },
    } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.engagement.create).mockResolvedValueOnce({ id: 'eng-1' } as any)
    vi.mocked(prisma.contract.create).mockResolvedValueOnce({ id: 'contract-1' } as any)
    vi.mocked(prisma.milestone.create).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.application.update).mockResolvedValueOnce({} as any)

    const result = await acceptProposal('app-1')
    expect(result).toEqual({ success: true, engagementId: 'eng-1' })
    expect(prisma.engagement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-1',
          talentId: 'talent-1',
          clientId: 'client-id',
        }),
      }),
    )
    expect(prisma.contract.create).toHaveBeenCalled()
    expect(prisma.milestone.create).toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    engagement: { findUnique: vi.fn() },
    contract: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoice: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    milestone: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
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
    ENGAGEMENT_DETAIL: (id: string) => `/dashboard/engagements/${id}`,
  },
}))

vi.mock('@/actions/notifications', () => ({
  createNotification: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

const mockClient = { user: { id: 'client-1', role: 'client' } }
const mockTalent = { user: { id: 'talent-1', role: 'talent' } }

const mockEngagement = {
  id: 'eng-1',
  clientId: 'client-1',
  talentId: 'talent-1',
  jobPostId: 'job-1',
  status: 'active',
  startDate: new Date(),
  endDate: null,
}

const mockContract = {
  id: 'contract-1',
  engagementId: 'eng-1',
  clientId: 'client-1',
  talentId: 'talent-1',
  title: 'Test Contract',
  terms: 'Work description here',
  rate: 5000,
  rateType: 'fixed',
  startDate: new Date(),
  endDate: null,
  status: 'draft',
  signedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 'client-1', name: 'Client', email: 'client@test.com' },
  talent: { id: 'talent-1', name: 'Talent', email: 'talent@test.com' },
}

const mockInvoice = {
  id: 'inv-1',
  contractId: 'contract-1',
  engagementId: 'eng-1',
  fromId: 'talent-1',
  toId: 'client-1',
  amount: 1000,
  currency: 'USD',
  description: 'Milestone 1',
  status: 'pending',
  dueDate: null,
  paidAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

let getContract: typeof import('@/actions/contracts').getContract
let createContract: typeof import('@/actions/contracts').createContract
let signContract: typeof import('@/actions/contracts').signContract
let terminateContract: typeof import('@/actions/contracts').terminateContract

let getInvoices: typeof import('@/actions/invoices').getInvoices
let createInvoice: typeof import('@/actions/invoices').createInvoice
let markInvoicePaid: typeof import('@/actions/invoices').markInvoicePaid

let getMilestones: typeof import('@/actions/milestones').getMilestones
let createMilestone: typeof import('@/actions/milestones').createMilestone
let completeMilestone: typeof import('@/actions/milestones').completeMilestone
let approveMilestone: typeof import('@/actions/milestones').approveMilestone
let rejectMilestone: typeof import('@/actions/milestones').rejectMilestone

beforeEach(async () => {
  vi.clearAllMocks()
  const c = await import('@/actions/contracts')
  getContract = c.getContract
  createContract = c.createContract
  signContract = c.signContract
  terminateContract = c.terminateContract

  const inv = await import('@/actions/invoices')
  getInvoices = inv.getInvoices
  createInvoice = inv.createInvoice
  markInvoicePaid = inv.markInvoicePaid

  const m = await import('@/actions/milestones')
  getMilestones = m.getMilestones
  createMilestone = m.createMilestone
  completeMilestone = m.completeMilestone
  approveMilestone = m.approveMilestone
  rejectMilestone = m.rejectMilestone
})

describe('getContract', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getContract('eng-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns contract when found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(mockContract)

    const result = await getContract('eng-1')
    expect(result).toEqual({ success: true, data: mockContract })
  })

  it('returns error when contract not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(null)

    const result = await getContract('eng-1')
    expect(result).toEqual({ success: false, error: 'Contract not found' })
  })
})

describe('createContract', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not a client', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'Only clients can create contracts' })
  })

  it('returns error when engagement not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(null)

    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'Engagement not found' })
  })

  it('returns error when not the engagement client', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-client', role: 'client' } } as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagement as any)

    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when engagement is not active', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce({ ...mockEngagement, status: 'ended' } as any)

    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'Engagement is not active' })
  })

  it('returns error when contract already exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagement as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(mockContract as any)

    const result = await createContract({
      engagementId: 'eng-1', title: 'Test', terms: 'Terms',
      rate: 1000, rateType: 'fixed', startDate: '2026-06-01',
    })
    expect(result).toEqual({ error: 'A contract already exists for this engagement' })
  })

  it('creates contract successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagement as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.contract.create).mockResolvedValueOnce(mockContract as any)

    const result = await createContract({
      engagementId: 'eng-1', title: 'Test Contract', terms: 'Work description here',
      rate: 5000, rateType: 'fixed', startDate: '2026-06-01',
    })

    expect(prisma.contract.create).toHaveBeenCalledWith({
      data: {
        engagementId: 'eng-1', clientId: 'client-1', talentId: 'talent-1',
        title: 'Test Contract', terms: 'Work description here',
        rate: 5000, rateType: 'fixed', startDate: expect.any(Date), endDate: null,
      },
    })
    expect('data' in result && result.success).toBe(true)
  })
})

describe('signContract', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await signContract('contract-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('signs contract successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, engagement: { id: 'eng-1' } } as any)
    vi.mocked(prisma.contract.update).mockResolvedValueOnce({} as any)

    const result = await signContract('contract-1')
    expect(prisma.contract.update).toHaveBeenCalledWith({
      where: { id: 'contract-1' },
      data: { status: 'active', signedAt: expect.any(Date) },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('terminateContract', () => {
  it('returns error when not the client', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, engagement: { id: 'eng-1' } } as any)
    const result = await terminateContract('contract-1')
    expect(result).toEqual({ error: 'Only the client can terminate a contract' })
  })

  it('terminates contract successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'active', engagement: { id: 'eng-1' } } as any)
    vi.mocked(prisma.contract.update).mockResolvedValueOnce({} as any)

    const result = await terminateContract('contract-1')
    expect(prisma.contract.update).toHaveBeenCalledWith({
      where: { id: 'contract-1' },
      data: { status: 'terminated' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('getInvoices', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getInvoices('eng-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns invoices for participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.engagement.findUnique).mockResolvedValueOnce(mockEngagement as any)
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([mockInvoice])

    const result = await getInvoices('eng-1')
    expect('data' in result && result.success).toBe(true)
    if (!('data' in result)) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].amount).toBe(1000)
  })
})

describe('createInvoice', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createInvoice({ contractId: 'contract-1', engagementId: 'eng-1', amount: 500 })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when contract not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(null)
    const result = await createInvoice({ contractId: 'contract-1', engagementId: 'eng-1', amount: 500 })
    expect(result).toEqual({ error: 'Contract not found' })
  })

  it('returns error when contract not active', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'draft' } as any)
    const result = await createInvoice({ contractId: 'contract-1', engagementId: 'eng-1', amount: 500 })
    expect(result).toEqual({ error: 'Contract is not active' })
  })

  it('creates invoice as talent', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'active' } as any)
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce(mockInvoice as any)

    const result = await createInvoice({
      contractId: 'contract-1', engagementId: 'eng-1', amount: 1000, description: 'Milestone 1',
    })

    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: {
        contractId: 'contract-1', engagementId: 'eng-1',
        fromId: 'talent-1', toId: 'client-1',
        amount: 1000, description: 'Milestone 1', dueDate: null,
      },
    })
    expect('data' in result && result.success).toBe(true)
  })

  it('creates invoice as client', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'active' } as any)
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce({ ...mockInvoice, fromId: 'client-1', toId: 'talent-1' } as any)

    const result = await createInvoice({ contractId: 'contract-1', engagementId: 'eng-1', amount: 500 })
    expect(prisma.invoice.create).toHaveBeenCalled()
    expect('data' in result && result.success).toBe(true)
  })
})

const mockMilestone = {
  id: 'ms-1',
  contractId: 'contract-1',
  title: 'Design homepage',
  description: 'Create wireframes and mockups',
  amount: 2500,
  dueDate: null,
  status: 'pending',
  completedAt: null,
  approvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('getMilestones', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getMilestones('contract-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns milestones for participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'active' } as any)
    vi.mocked(prisma.milestone.findMany).mockResolvedValueOnce([mockMilestone])

    const result = await getMilestones('contract-1')
    expect('data' in result && result.success).toBe(true)
    if (!('data' in result)) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].title).toBe('Design homepage')
  })
})

describe('createMilestone', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createMilestone({ contractId: 'contract-1', title: 'Test', amount: 500 })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('creates milestone successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce({ ...mockContract, status: 'active' } as any)
    vi.mocked(prisma.milestone.create).mockResolvedValueOnce(mockMilestone as any)

    const result = await createMilestone({ contractId: 'contract-1', title: 'Design homepage', amount: 2500 })
    expect(prisma.milestone.create).toHaveBeenCalled()
    expect('data' in result && result.success).toBe(true)
  })
})

describe('completeMilestone', () => {
  it('returns error when not talent', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.milestone.findUnique).mockResolvedValueOnce({
      ...mockMilestone,
      contract: { talentId: 'talent-1', clientId: 'client-1', engagementId: 'eng-1' },
    } as any)
    const result = await completeMilestone('ms-1')
    expect(result).toEqual({ error: 'Only the talent can mark milestones as completed' })
  })

  it('completes milestone as talent', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.milestone.findUnique).mockResolvedValueOnce({
      ...mockMilestone,
      contract: { talentId: 'talent-1', clientId: 'client-1', engagementId: 'eng-1' },
    } as any)
    vi.mocked(prisma.milestone.update).mockResolvedValueOnce({} as any)

    const result = await completeMilestone('ms-1')
    expect(prisma.milestone.update).toHaveBeenCalledWith({
      where: { id: 'ms-1' },
      data: { status: 'completed', completedAt: expect.any(Date) },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('approveMilestone', () => {
  it('returns error when not client', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.milestone.findUnique).mockResolvedValueOnce({
      ...mockMilestone,
      contract: { clientId: 'client-1', talentId: 'talent-1', engagementId: 'eng-1' },
    } as any)
    const result = await approveMilestone('ms-1')
    expect(result).toEqual({ error: 'Only the client can approve milestones' })
  })

  it('approves completed milestone', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.milestone.findUnique).mockResolvedValueOnce({
      ...mockMilestone,
      status: 'completed',
      contract: { clientId: 'client-1', talentId: 'talent-1', engagementId: 'eng-1' },
    } as any)
    vi.mocked(prisma.milestone.update).mockResolvedValueOnce({} as any)

    const result = await approveMilestone('ms-1')
    expect(prisma.milestone.update).toHaveBeenCalledWith({
      where: { id: 'ms-1' },
      data: { status: 'approved', approvedAt: expect.any(Date) },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('rejectMilestone', () => {
  it('rejects and resets to pending', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.milestone.findUnique).mockResolvedValueOnce({
      ...mockMilestone,
      status: 'completed',
      contract: { clientId: 'client-1', talentId: 'talent-1', engagementId: 'eng-1' },
    } as any)
    vi.mocked(prisma.milestone.update).mockResolvedValueOnce({} as any)

    const result = await rejectMilestone('ms-1')
    expect(prisma.milestone.update).toHaveBeenCalledWith({
      where: { id: 'ms-1' },
      data: { status: 'pending', completedAt: null },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('markInvoicePaid', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await markInvoicePaid('inv-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('marks invoice as paid when recipient', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)
    vi.mocked(prisma.invoice.update).mockResolvedValueOnce({} as any)

    const result = await markInvoicePaid('inv-1')
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'paid', paidAt: expect.any(Date) },
    })
    expect(result).toEqual({ success: true })
  })

  it('returns error when invoice already paid', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce({ ...mockInvoice, status: 'paid' } as any)
    const result = await markInvoicePaid('inv-1')
    expect(result).toEqual({ error: 'Invoice is already paid' })
  })

  it('returns error when not authorized', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'stranger' } } as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)
    const result = await markInvoicePaid('inv-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

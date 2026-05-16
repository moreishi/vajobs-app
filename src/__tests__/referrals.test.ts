import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    referralReward: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    referralMilestone: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    connectTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/actions/notifications', () => ({
  createNotification: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')
const { createNotification } = await import('@/actions/notifications')
const { sendEmail } = await import('@/lib/email')

let grantReferralReward: typeof import('@/actions/referrals').grantReferralReward
let sendReferralInvite: typeof import('@/actions/referrals').sendReferralInvite

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/referrals')
  grantReferralReward = mod.grantReferralReward
  sendReferralInvite = mod.sendReferralInvite
})

describe('grantReferralReward', () => {
  it('grants 10 connects to both referrer and referee by default', async () => {
    vi.mocked(prisma.referralReward.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}, {}, {}, {}])

    await grantReferralReward('referee-id', 'referrer-id', 'talent', 'submitting their first application')

    expect(prisma.referralReward.create).toHaveBeenCalledWith({
      data: {
        referrerId: 'referrer-id',
        refereeId: 'referee-id',
        amount: 10,
      },
    })
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('uses provided amount when specified', async () => {
    vi.mocked(prisma.referralReward.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}, {}, {}, {}])

    await grantReferralReward('referee-id', 'referrer-id', 'client', 'posting their first job', 15)

    expect(prisma.referralReward.create).toHaveBeenCalledWith({
      data: {
        referrerId: 'referrer-id',
        refereeId: 'referee-id',
        amount: 15,
      },
    })
  })

  it('returns early when reward already exists', async () => {
    vi.mocked(prisma.referralReward.findUnique).mockResolvedValueOnce({
      id: 'existing-reward',
      referrerId: 'referrer-id',
      refereeId: 'referee-id',
      amount: 10,
      createdAt: new Date(),
    })

    await grantReferralReward('referee-id', 'referrer-id', 'talent', 'submitting their first application')

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates notifications for both parties', async () => {
    vi.mocked(prisma.referralReward.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}, {}, {}, {}])

    await grantReferralReward('referee-id', 'referrer-id', 'talent', 'submitting their first application')

    expect(createNotification).toHaveBeenCalledTimes(2)
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'referee-id', type: 'referral_reward' })
    )
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'referrer-id', type: 'referral_reward' })
    )
  })
})

describe('checkAndGrantMilestoneBonuses', () => {
  let checkAndGrantMilestoneBonuses: typeof import('@/actions/referrals').checkAndGrantMilestoneBonuses

  beforeEach(async () => {
    const mod = await import('@/actions/referrals')
    checkAndGrantMilestoneBonuses = mod.checkAndGrantMilestoneBonuses
  })

  it('grants bonus for milestone 3 when referrer has 3 rewards', async () => {
    vi.mocked(prisma.referralReward.count).mockResolvedValueOnce(3)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}, {}])

    await checkAndGrantMilestoneBonuses('referrer-id')

    expect(prisma.referralMilestone.create).toHaveBeenCalledWith({
      data: { referrerId: 'referrer-id', milestone: 3, bonus: 20 },
    })
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('grants bonus for milestones 3, 5, and 10 when all are reached', async () => {
    vi.mocked(prisma.referralReward.count).mockResolvedValueOnce(12)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}])

    await checkAndGrantMilestoneBonuses('referrer-id')

    expect(prisma.referralMilestone.create).toHaveBeenCalledTimes(3)
    expect(prisma.referralMilestone.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ milestone: 3, bonus: 20 }) }),
    )
    expect(prisma.referralMilestone.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ milestone: 5, bonus: 50 }) }),
    )
    expect(prisma.referralMilestone.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ milestone: 10, bonus: 100 }) }),
    )
  })

  it('skips already-claimed milestones', async () => {
    vi.mocked(prisma.referralReward.count).mockResolvedValueOnce(5)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([
      { id: 'm1', referrerId: 'referrer-id', milestone: 3, bonus: 20, createdAt: new Date() },
    ])

    await checkAndGrantMilestoneBonuses('referrer-id')

    // Only milestone 5 should be granted (3 was already claimed)
    expect(prisma.referralMilestone.create).toHaveBeenCalledTimes(1)
    expect(prisma.referralMilestone.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ milestone: 5, bonus: 50 }),
      }),
    )
  })

  it('does nothing when no milestones are reached', async () => {
    vi.mocked(prisma.referralReward.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])

    await checkAndGrantMilestoneBonuses('referrer-id')

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

describe('getReferralConversionStats', () => {
  let getReferralConversionStats: typeof import('@/lib/referrals').getReferralConversionStats

  beforeEach(async () => {
    const mod = await import('@/lib/referrals')
    getReferralConversionStats = mod.getReferralConversionStats
  })

  it('returns zeros when there are no referred users', () => {
    const result = getReferralConversionStats([])
    expect(result).toEqual({
      totalReferrals: 0,
      converted: 0,
      pending: 0,
      conversionRate: 0,
    })
  })

  it('counts referred users with rewards as converted', () => {
    const users = [
      { referralRewardsReceived: [{ amount: 10 }] },
      { referralRewardsReceived: [] },
    ]
    const result = getReferralConversionStats(users as any)
    expect(result).toEqual({
      totalReferrals: 2,
      converted: 1,
      pending: 1,
      conversionRate: 50,
    })
  })

  it('calculates correct rate when all converted', () => {
    const users = [
      { referralRewardsReceived: [{ amount: 10 }] },
      { referralRewardsReceived: [{ amount: 10 }] },
      { referralRewardsReceived: [{ amount: 10 }] },
    ]
    const result = getReferralConversionStats(users as any)
    expect(result).toEqual({
      totalReferrals: 3,
      converted: 3,
      pending: 0,
      conversionRate: 100,
    })
  })

  it('rounds conversion rate to nearest integer', () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      referralRewardsReceived: i < 2 ? [{ amount: 10 }] : [],
    }))
    const result = getReferralConversionStats(users as any)
    // 2/7 = 28.57... -> rounds to 29
    expect(result).toEqual({
      totalReferrals: 7,
      converted: 2,
      pending: 5,
      conversionRate: 29,
    })
  })
})

describe('getReferralRewardsHistory', () => {
  let getReferralRewardsHistory: typeof import('@/actions/referrals').getReferralRewardsHistory

  beforeEach(async () => {
    const mod = await import('@/actions/referrals')
    getReferralRewardsHistory = mod.getReferralRewardsHistory
  })

  it('returns rewards with referee info for the referrer', async () => {
    vi.mocked(prisma.referralReward.findMany).mockResolvedValueOnce([
      {
        id: 'r1',
        amount: 10,
        createdAt: new Date('2026-05-01'),
        referee: { name: 'Jane Doe', email: 'jane@test.com' },
      },
      {
        id: 'r2',
        amount: 15,
        createdAt: new Date('2026-05-10'),
        referee: { name: null, email: 'bob@test.com' },
      },
    ] as any)

    const result = await getReferralRewardsHistory('referrer-id')

    expect(prisma.referralReward.findMany).toHaveBeenCalledWith({
      where: { referrerId: 'referrer-id' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        referee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(2)
    expect(result[0].refereeName).toBe('Jane Doe')
    expect(result[0].refereeEmail).toBe('jane@test.com')
    expect(result[1].refereeName).toBe('bob@test.com')
    expect(result[1].refereeEmail).toBe('bob@test.com')
  })

  it('returns milestone bonuses alongside referral rewards', async () => {
    vi.mocked(prisma.referralReward.findMany).mockResolvedValueOnce([
      {
        id: 'r1',
        amount: 10,
        createdAt: new Date('2026-05-01'),
        referee: { name: 'Jane Doe', email: 'jane@test.com' },
      },
    ] as any)
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([
      {
        id: 'm1',
        milestone: 3,
        bonus: 20,
        createdAt: new Date('2026-05-15'),
      },
    ] as any)

    const result = await getReferralRewardsHistory('referrer-id')

    // Should return both the reward and the milestone bonus
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('milestone')
    expect(result[0].amount).toBe(20)
    expect(result[0].label).toBe('3 referrals milestone')
  })

  it('returns empty array when no history exists', async () => {
    vi.mocked(prisma.referralReward.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.referralMilestone.findMany).mockResolvedValueOnce([])

    const result = await getReferralRewardsHistory('referrer-id')

    expect(result).toEqual([])
  })
})

describe('sendReferralInvite', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-id', role: 'talent' } } as any)
  })

  it('sends invite email successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-id',
      referralCode: 'ABC12345',
      name: 'John Doe',
    } as any)

    const result = await sendReferralInvite('friend@example.com', 'http://localhost:3000')

    expect(result).toEqual({ success: true })
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'friend@example.com',
        subject: expect.stringContaining('John Doe'),
      }),
    )
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const result = await sendReferralInvite('friend@example.com', 'http://localhost:3000')

    expect(result).toEqual({ error: 'Not authenticated' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('returns error when user has no referral code', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-id',
      referralCode: null,
      name: 'John Doe',
    } as any)

    const result = await sendReferralInvite('friend@example.com', 'http://localhost:3000')

    expect(result).toEqual({ error: 'No referral code found' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('returns error when email is empty', async () => {
    const result = await sendReferralInvite('', 'http://localhost:3000')

    expect(result).toEqual({ error: 'Email is required' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('handles email send failure gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-id',
      referralCode: 'ABC12345',
      name: 'John Doe',
    } as any)
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Network error'))

    const result = await sendReferralInvite('friend@example.com', 'http://localhost:3000')

    expect(result).toEqual({ error: 'Failed to send invite' })
  })
})

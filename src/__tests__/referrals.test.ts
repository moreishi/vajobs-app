import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    referralReward: {
      findUnique: vi.fn(),
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

const { prisma } = await import('@/lib/prisma')
const { createNotification } = await import('@/actions/notifications')

let grantReferralReward: typeof import('@/actions/referrals').grantReferralReward

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/referrals')
  grantReferralReward = mod.grantReferralReward
})

describe('grantReferralReward', () => {
  it('grants 10 connects to both referrer and referee', async () => {
    vi.mocked(prisma.referralReward.findUnique).mockResolvedValueOnce(null)
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

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    xpTransaction: { create: vi.fn(), findFirst: vi.fn() },
    notification: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/actions/notifications', () => ({
  createNotification: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')

let awardXp: typeof import('@/actions/reputation').awardXp
let getReputation: typeof import('@/actions/reputation').getReputation
let getTier: typeof import('@/lib/reputation').getTier

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/reputation')
  awardXp = mod.awardXp
  getReputation = mod.getReputation
  const lib = await import('@/lib/reputation')
  getTier = lib.getTier
})

describe('getTier', () => {
  it('returns bronze for 0 xp', () => {
    const result = getTier(0)
    expect(result).toMatchObject({ name: 'Bronze', label: 'Bronze', minXp: 0, maxXp: 499 })
  })

  it('returns bronze for 499 xp', () => {
    const result = getTier(499)
    expect(result.name).toBe('Bronze')
  })

  it('returns silver for 500 xp', () => {
    const result = getTier(500)
    expect(result).toMatchObject({ name: 'Silver', label: 'Silver', minXp: 500, maxXp: 1999 })
  })

  it('returns silver for 1999 xp', () => {
    const result = getTier(1999)
    expect(result.name).toBe('Silver')
  })

  it('returns gold for 2000 xp', () => {
    const result = getTier(2000)
    expect(result).toMatchObject({ name: 'Gold', label: 'Gold', minXp: 2000, maxXp: 4999 })
  })

  it('returns gold for 4999 xp', () => {
    const result = getTier(4999)
    expect(result.name).toBe('Gold')
  })

  it('returns platinum for 5000 xp', () => {
    const result = getTier(5000)
    expect(result).toMatchObject({ name: 'Platinum', label: 'Platinum', minXp: 5000, maxXp: Infinity })
  })

  it('returns platinum for 10000 xp', () => {
    const result = getTier(10000)
    expect(result.name).toBe('Platinum')
  })
})

describe('awardXp', () => {
  it('creates xp transaction and updates user xp', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 100 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 150 } as any)

    await awardXp({ userId: 'user-1', amount: 50, reason: 'test_reason' })

    expect(prisma.xpTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        amount: 50,
        reason: 'test_reason',
        referenceId: undefined,
      },
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { xp: { increment: 50 } },
    })
  })

  it('passes referenceId when provided', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 0 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 50 } as any)

    await awardXp({ userId: 'user-1', amount: 50, reason: 'test', referenceId: 'ref-1' })

    expect(prisma.xpTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        amount: 50,
        reason: 'test',
        referenceId: 'ref-1',
      },
    })
  })

  it('creates notification on tier up from bronze to silver', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 480 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 530 } as any)
    const { createNotification } = await import('@/actions/notifications')

    await awardXp({ userId: 'user-1', amount: 50, reason: 'test' })

    expect(createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'xp_level_up',
      title: 'Silver Tier Unlocked!',
      body: expect.stringContaining('Silver'),
    })
  })

  it('creates notification on tier up from silver to gold', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 1950 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 2050 } as any)
    const { createNotification } = await import('@/actions/notifications')

    await awardXp({ userId: 'user-1', amount: 100, reason: 'test' })

    expect(createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'xp_level_up',
      title: 'Gold Tier Unlocked!',
      body: expect.stringContaining('Gold'),
    })
  })

  it('creates notification on tier up from gold to platinum', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 4950 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 5050 } as any)
    const { createNotification } = await import('@/actions/notifications')

    await awardXp({ userId: 'user-1', amount: 100, reason: 'test' })

    expect(createNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'xp_level_up',
      title: 'Platinum Tier Unlocked!',
      body: expect.stringContaining('Platinum'),
    })
  })

  it('does not create notification when staying in same tier', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 100 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 150 } as any)
    const { createNotification } = await import('@/actions/notifications')

    await awardXp({ userId: 'user-1', amount: 50, reason: 'test' })

    expect(createNotification).not.toHaveBeenCalled()
  })

  it('does not create notification when staying in same tier near boundary', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 400 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 450 } as any)
    const { createNotification } = await import('@/actions/notifications')

    await awardXp({ userId: 'user-1', amount: 50, reason: 'test' })

    expect(createNotification).not.toHaveBeenCalled()
  })

  it('returns old and new tier info', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 100 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 150 } as any)

    const result = await awardXp({ userId: 'user-1', amount: 50, reason: 'test' })

    expect(result).toMatchObject({
      xpAwarded: 50,
      totalXp: 150,
      oldTier: { name: 'Bronze' },
      newTier: { name: 'Bronze' },
    })
  })

  it('returns correct tier info when tier up occurs', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ xp: 480 } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ xp: 530 } as any)

    const result = await awardXp({ userId: 'user-1', amount: 50, reason: 'test' })

    expect(result).toMatchObject({
      oldTier: { name: 'Bronze' },
      newTier: { name: 'Silver' },
      didLevelUp: true,
    })
  })

  it('handles user not found gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const result = await awardXp({ userId: 'nonexistent', amount: 50, reason: 'test' })

    expect(result).toEqual({ xpAwarded: 0, totalXp: 0, oldTier: null, newTier: null, didLevelUp: false })
    expect(prisma.xpTransaction.create).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

describe('getReputation', () => {
  it('returns reputation data for existing user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      xp: 750,
      _count: { xpTransactions: 3 },
    } as any)

    const result = await getReputation('user-1')

    expect(result).toMatchObject({
      xp: 750,
      totalTransactions: 3,
      tier: { name: 'Silver', label: 'Silver' },
      progress: {
        current: 750,
        min: 500,
        max: 1999,
        percentage: 17,
      },
    })
  })

  it('returns null for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const result = await getReputation('nonexistent')
    expect(result).toBeNull()
  })

  it('returns zero progress for bronze at 0 xp', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      xp: 0,
      _count: { xpTransactions: 0 },
    } as any)

    const result = await getReputation('user-1')

    expect(result).toMatchObject({
      xp: 0,
      tier: { name: 'Bronze' },
      progress: { current: 0, min: 0, max: 499, percentage: 0 },
    })
  })

  it('returns 100% progress for platinum', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      xp: 5000,
      _count: { xpTransactions: 10 },
    } as any)

    const result = await getReputation('user-1')

    expect(result).toMatchObject({
      xp: 5000,
      tier: { name: 'Platinum' },
      progress: { current: 5000, min: 5000, max: 5000, percentage: 100 },
    })
  })
})

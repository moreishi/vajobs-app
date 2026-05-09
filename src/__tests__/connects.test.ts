import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CONNECT_PACKAGES } from '@/lib/constants'

let mockTx: { user: { update: any }, connectTransaction: { create: any } }

vi.mock('@/lib/prisma', () => {
  mockTx = {
    user: { update: vi.fn() },
    connectTransaction: { create: vi.fn() },
  }
  return {
    prisma: {
      user: { findUnique: vi.fn(), update: vi.fn() },
      connectTransaction: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      notification: { create: vi.fn() },
      $transaction: vi.fn((fn: any) => fn(mockTx)),
    },
  }
})

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let purchaseConnects: typeof import('@/actions/connects').purchaseConnects
let getConnectHistory: typeof import('@/actions/connects').getConnectHistory

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/connects')
  purchaseConnects = mod.purchaseConnects
  getConnectHistory = mod.getConnectHistory
})

describe('CONNECT_PACKAGES', () => {
  it('provides the correct package options', () => {
    expect(CONNECT_PACKAGES).toEqual([
      { amount: 10, price: 5 },
      { amount: 25, price: 10 },
      { amount: 50, price: 18 },
      { amount: 100, price: 30 },
    ])
  })
})

describe('purchaseConnects', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await purchaseConnects(undefined, new FormData())
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error for invalid package amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    const formData = new FormData()
    formData.set('amount', '7')
    const result = await purchaseConnects(undefined, formData)
    expect(result).toEqual({ error: 'Invalid package' })
  })

  it('returns error for missing amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    const result = await purchaseConnects(undefined, new FormData())
    expect(result).toEqual({ error: 'Invalid package' })
  })

  it('processes purchase for valid package', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)

    const formData = new FormData()
    formData.set('amount', '50')

    const result = await purchaseConnects(undefined, formData)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { connects: { increment: 50 } },
    })
    expect(mockTx.connectTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        amount: 50,
        type: 'purchase',
        description: 'Purchased 50 connects for $18',
      },
    })
    expect(result).toEqual({ success: true })
  })

  it('processes purchase for different package amounts', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)

    const formData = new FormData()
    formData.set('amount', '10')

    const result = await purchaseConnects(undefined, formData)

    expect(mockTx.connectTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 10, description: 'Purchased 10 connects for $5' }),
      })
    )
    expect(result).toEqual({ success: true })
  })
})

describe('getConnectHistory', () => {
  it('returns empty when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getConnectHistory()
    expect(result).toEqual({ transactions: [], total: 0 })
  })

  it('returns transactions with pagination defaults', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    const mockTxs = [
      {
        id: 'tx-1',
        userId: 'user-id',
        amount: 50,
        type: 'purchase',
        description: 'Purchased 50 connects for $18',
        createdAt: new Date(),
      },
    ]
    vi.mocked(prisma.connectTransaction.findMany).mockResolvedValueOnce(mockTxs)
    vi.mocked(prisma.connectTransaction.count).mockResolvedValueOnce(1)

    const result = await getConnectHistory()

    expect(prisma.connectTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    })
    expect(result).toEqual({ transactions: mockTxs, total: 1 })
  })

  it('supports custom page and pageSize', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.connectTransaction.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.connectTransaction.count).mockResolvedValueOnce(0)

    await getConnectHistory(3, 10)

    expect(prisma.connectTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      orderBy: { createdAt: 'desc' },
      skip: 20,
      take: 10,
    })
  })
})

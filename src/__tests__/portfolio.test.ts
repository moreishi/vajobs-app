import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    portfolioItem: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const mockTalent = { user: { id: 'user-1', role: 'talent' } }
const mockAdmin = { user: { id: 'admin-1', role: 'admin' } }
const mockProfile = { id: 'profile-1', userId: 'user-1' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('addPortfolioItem', () => {
  it('returns error when not authenticated', async () => {
    const { addPortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await addPortfolioItem({ title: 'My Project', type: 'project' })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not a talent', async () => {
    const { addPortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(mockAdmin as any)
    const result = await addPortfolioItem({ title: 'My Project', type: 'project' })
    expect(result).toEqual({ error: 'Only talents can add portfolio items' })
  })

  it('returns error when profile not found', async () => {
    const { addPortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(null)
    const result = await addPortfolioItem({ title: 'My Project', type: 'project' })
    expect(result).toEqual({ error: 'Profile not found. Set up your profile first.' })
  })

  it('creates portfolio item', async () => {
    const { addPortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(mockProfile as any)
    vi.mocked(prisma.portfolioItem.create).mockResolvedValueOnce({} as any)

    const result = await addPortfolioItem({
      title: 'My Project',
      description: 'A cool project',
      url: 'https://example.com',
      type: 'project',
    })

    expect(prisma.portfolioItem.create).toHaveBeenCalledWith({
      data: {
        profileId: 'profile-1',
        title: 'My Project',
        description: 'A cool project',
        url: 'https://example.com',
        imageUrl: null,
        type: 'project',
      },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('deletePortfolioItem', () => {
  it('returns error when not authenticated', async () => {
    const { deletePortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await deletePortfolioItem('item-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('deletes own portfolio item', async () => {
    const { deletePortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(mockProfile as any)
    vi.mocked(prisma.portfolioItem.findFirst).mockResolvedValueOnce({ id: 'item-1', profileId: 'profile-1' } as any)
    vi.mocked(prisma.portfolioItem.delete).mockResolvedValueOnce({} as any)

    const result = await deletePortfolioItem('item-1')

    expect(prisma.portfolioItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
    expect(result).toEqual({ success: true })
  })

  it('returns error when item not found', async () => {
    const { deletePortfolioItem } = await import('@/actions/portfolio')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(mockProfile as any)
    vi.mocked(prisma.portfolioItem.findFirst).mockResolvedValueOnce(null)

    const result = await deletePortfolioItem('item-1')
    expect(result).toEqual({ error: 'Portfolio item not found' })
  })
})

describe('getPortfolioItems', () => {
  it('returns empty array when profile not found', async () => {
    const { getPortfolioItems } = await import('@/actions/portfolio')
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(null)
    const result = await getPortfolioItems('user-1')
    expect(result).toEqual([])
  })

  it('returns portfolio items for user', async () => {
    const { getPortfolioItems } = await import('@/actions/portfolio')
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(mockProfile as any)
    const now = new Date()
    vi.mocked(prisma.portfolioItem.findMany).mockResolvedValueOnce([
      { id: 'item-1', profileId: 'profile-1', title: 'My Project', description: null, url: null, imageUrl: null, type: 'project', createdAt: now, updatedAt: now },
    ] as any)

    const result = await getPortfolioItems('user-1')

    expect(prisma.portfolioItem.findMany).toHaveBeenCalledWith({
      where: { profileId: 'profile-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('My Project')
  })
})

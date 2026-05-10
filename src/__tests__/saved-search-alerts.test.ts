import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    savedSearchAlert: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/email/worker', () => ({
  enqueueEmail: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const mockUser = { id: 'user-1', email: 'test@test.com' }

function mockAuth(asUser = true) {
  vi.mocked(auth).mockResolvedValueOnce(asUser ? { user: mockUser } : null)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createAlert', () => {
  it('returns error when not authenticated', async () => {
    const { createAlert } = await import('@/actions/saved-search-alerts')
    mockAuth(false)
    const result = await createAlert({ type: 'jobs', name: 'Test', filters: { query: 'react' } })
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('creates alert for authenticated user', async () => {
    const { createAlert } = await import('@/actions/saved-search-alerts')
    mockAuth()
    vi.mocked(prisma.savedSearchAlert.create).mockResolvedValueOnce({} as any)

    const result = await createAlert({ type: 'jobs', name: 'React Jobs', filters: { query: 'react', type: 'full-time' } })

    expect(prisma.savedSearchAlert.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'jobs',
        name: 'React Jobs',
        filters: JSON.stringify({ query: 'react', type: 'full-time' }),
      },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('deleteAlert', () => {
  it('returns error when not authenticated', async () => {
    const { deleteAlert } = await import('@/actions/saved-search-alerts')
    mockAuth(false)
    const result = await deleteAlert('alert-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('deletes alert with userId guard', async () => {
    const { deleteAlert } = await import('@/actions/saved-search-alerts')
    mockAuth()
    vi.mocked(prisma.savedSearchAlert.deleteMany).mockResolvedValueOnce({ count: 1 } as any)

    const result = await deleteAlert('alert-1')

    expect(prisma.savedSearchAlert.deleteMany).toHaveBeenCalledWith({
      where: { id: 'alert-1', userId: 'user-1' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('toggleAlert', () => {
  it('returns error when not authenticated', async () => {
    const { toggleAlert } = await import('@/actions/saved-search-alerts')
    mockAuth(false)
    const result = await toggleAlert('alert-1', false)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('toggles alert active state', async () => {
    const { toggleAlert } = await import('@/actions/saved-search-alerts')
    mockAuth()
    vi.mocked(prisma.savedSearchAlert.updateMany).mockResolvedValueOnce({} as any)

    const result = await toggleAlert('alert-1', false)

    expect(prisma.savedSearchAlert.updateMany).toHaveBeenCalledWith({
      where: { id: 'alert-1', userId: 'user-1' },
      data: { active: false },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('getAlerts', () => {
  it('returns empty array when not authenticated', async () => {
    const { getAlerts } = await import('@/actions/saved-search-alerts')
    mockAuth(false)
    const result = await getAlerts()
    expect(result).toEqual([])
  })

  it('returns alerts with parsed filters', async () => {
    const { getAlerts } = await import('@/actions/saved-search-alerts')
    mockAuth()
    const now = new Date()
    vi.mocked(prisma.savedSearchAlert.findMany).mockResolvedValueOnce([
      {
        id: 'alert-1',
        userId: 'user-1',
        type: 'jobs',
        name: 'React Jobs',
        filters: JSON.stringify({ query: 'react' }),
        active: true,
        lastMatchedAt: now,
        createdAt: now,
      },
    ] as any)

    const result = await getAlerts()

    expect(prisma.savedSearchAlert.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].filters).toEqual({ query: 'react' })
    expect(result[0].lastMatchedAt).toBe(now.toISOString())
    expect(result[0].createdAt).toBe(now.toISOString())
  })
})

describe('checkJobAlerts', () => {
  it('matches alerts and creates notifications', async () => {
    const { checkJobAlerts } = await import('@/actions/saved-search-alerts')
    vi.mocked(prisma.savedSearchAlert.findMany).mockResolvedValueOnce([
      {
        id: 'alert-1',
        userId: 'user-2',
        type: 'jobs',
        name: 'React Jobs',
        filters: JSON.stringify({ query: 'react' }),
        active: true,
        lastMatchedAt: null,
        createdAt: new Date(),
        user: { id: 'user-2', email: 'other@test.com' },
      },
    ] as any)
    vi.mocked(prisma.savedSearchAlert.update).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any)

    await checkJobAlerts('job-1', 'Senior React Developer', ['React', 'TypeScript'], 'Remote', 'full-time')

    expect(prisma.savedSearchAlert.update).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: { lastMatchedAt: expect.any(Date) },
    })
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-2',
        type: 'application_received',
        title: 'New job match: Senior React Developer',
      }),
    })
  })

  it('does not match when filters do not match', async () => {
    const { checkJobAlerts } = await import('@/actions/saved-search-alerts')
    vi.mocked(prisma.savedSearchAlert.findMany).mockResolvedValueOnce([
      {
        id: 'alert-1',
        userId: 'user-2',
        type: 'jobs',
        name: 'Python Jobs',
        filters: JSON.stringify({ query: 'python' }),
        active: true,
        lastMatchedAt: null,
        createdAt: new Date(),
        user: { id: 'user-2', email: 'other@test.com' },
      },
    ] as any)

    await checkJobAlerts('job-1', 'Senior React Developer', ['React'], 'Remote', 'full-time')

    expect(prisma.savedSearchAlert.update).not.toHaveBeenCalled()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })
})

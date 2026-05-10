import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    profile: { upsert: vi.fn() },
    emailLog: { count: vi.fn(), findMany: vi.fn() },
    jobPost: { count: vi.fn() },
    application: { count: vi.fn() },
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

let updateUserRole: typeof import('@/actions/admin').updateUserRole
let updateUserConnects: typeof import('@/actions/admin').updateUserConnects
let toggleVerification: typeof import('@/actions/admin').toggleVerification
let getEmailLogs: typeof import('@/actions/admin').getEmailLogs
let getEmailLogStats: typeof import('@/actions/admin').getEmailLogStats

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/admin')
  updateUserRole = mod.updateUserRole
  updateUserConnects = mod.updateUserConnects
  toggleVerification = mod.toggleVerification
  getEmailLogs = mod.getEmailLogs
  getEmailLogStats = mod.getEmailLogStats
})

describe('updateUserRole', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'talent' } } as any)
    const result = await updateUserRole('user-id', new FormData())
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error for invalid role', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    const formData = new FormData()
    formData.set('role', 'superadmin')
    const result = await updateUserRole('user-id', formData)
    expect(result).toEqual({ error: 'Invalid role' })
  })

  it('updates user role successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('role', 'talent')

    const result = await updateUserRole('user-id', formData)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { role: 'talent' },
    })
    expect(result).toEqual({ success: true })
  })

  it('accepts all valid roles', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    for (const role of ['guest', 'talent', 'client', 'admin']) {
      const formData = new FormData()
      formData.set('role', role)
      const result = await updateUserRole('user-id', formData)
      expect(result).toEqual({ success: true })
      vi.clearAllMocks()
      vi.mocked(auth).mockResolvedValue({ user: { role: 'admin' } } as any)
    }
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await updateUserRole('user-id', new FormData())
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('updateUserConnects', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'talent' } } as any)
    const result = await updateUserConnects('user-id', new FormData())
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error for invalid amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    const formData = new FormData()
    formData.set('connects', '-1')
    const result = await updateUserConnects('user-id', formData)
    expect(result).toEqual({ error: 'Invalid amount' })
  })

  it('returns error for NaN amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    const formData = new FormData()
    formData.set('connects', 'abc')
    const result = await updateUserConnects('user-id', formData)
    expect(result).toEqual({ error: 'Invalid amount' })
  })

  it('updates connects amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('connects', '50')

    const result = await updateUserConnects('user-id', formData)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { connects: 50 },
    })
    expect(result).toEqual({ success: true })
  })

  it('accepts zero connects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('connects', '0')

    const result = await updateUserConnects('user-id', formData)

    expect(result).toEqual({ success: true })
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await updateUserConnects('user-id', new FormData())
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('toggleVerification', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'talent' } } as any)
    const result = await toggleVerification('user-id', true)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('verifies a talent profile', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.profile.upsert).mockResolvedValueOnce({} as any)

    const result = await toggleVerification('user-id', true)

    expect(prisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      create: { userId: 'user-id', verified: true },
      update: { verified: true },
    })
    expect(result).toEqual({ success: true })
  })

  it('removes verification', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.profile.upsert).mockResolvedValueOnce({} as any)

    const result = await toggleVerification('user-id', false)

    expect(prisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      create: { userId: 'user-id', verified: false },
      update: { verified: false },
    })
    expect(result).toEqual({ success: true })
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await toggleVerification('user-id', true)
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('getEmailLogs', () => {
  it('returns empty when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'talent' } } as any)
    const result = await getEmailLogs({})
    expect(result).toEqual({ logs: [], total: 0 })
  })

  it('returns email logs for admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.emailLog.findMany).mockResolvedValueOnce([
      { id: 'log-1', userId: 'u1', email: 'test@test.com', type: 'application_received', subject: 'New Application', status: 'sent', error: null, createdAt: new Date() },
    ] as any)

    const result = await getEmailLogs({ status: 'sent' })

    expect(prisma.emailLog.findMany).toHaveBeenCalledWith({
      where: { status: 'sent' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 50,
    })
    expect(result.total).toBe(1)
    expect(result.logs[0].email).toBe('test@test.com')
    expect(result.logs[0].status).toBe('sent')
  })

  it('supports search filter', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(0)
    vi.mocked(prisma.emailLog.findMany).mockResolvedValueOnce([])

    await getEmailLogs({ search: 'test@test.com' })

    expect(prisma.emailLog.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { contains: 'test@test.com' } },
          { subject: { contains: 'test@test.com' } },
        ],
      },
    })
  })
})

describe('getEmailLogStats', () => {
  it('returns null when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'talent' } } as any)
    const result = await getEmailLogStats()
    expect(result).toBeNull()
  })

  it('returns email stats for admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: 'admin' } } as any)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(100)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(90)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(10)
    vi.mocked(prisma.emailLog.count).mockResolvedValueOnce(25)

    const result = await getEmailLogStats()

    expect(result).toEqual({ total: 100, sent: 90, failed: 10, recentCount: 25 })
  })
})

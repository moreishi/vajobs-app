import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
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

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/admin')
  updateUserRole = mod.updateUserRole
  updateUserConnects = mod.updateUserConnects
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

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
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

let getUsers: typeof import('@/actions/admin-users').getUsers
let toggleUserBan: typeof import('@/actions/admin-users').toggleUserBan
let updateUserRole: typeof import('@/actions/admin-users').updateUserRole

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/admin-users')
  getUsers = mod.getUsers
  toggleUserBan = mod.toggleUserBan
  updateUserRole = mod.updateUserRole
})

describe('getUsers', () => {
  it('returns empty when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'talent' } } as any)
    const result = await getUsers({})
    expect(result).toEqual({ users: [], total: 0 })
  })

  it('fetches users with filters', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([] as any)
    vi.mocked(prisma.user.count).mockResolvedValueOnce(0)

    await getUsers({ search: 'john', role: 'talent', page: 2 })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    )
  })
})

describe('toggleUserBan', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'talent' } } as any)
    const result = await toggleUserBan('u2')
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('prevents self-ban', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    const result = await toggleUserBan('u1')
    expect(result).toEqual({ error: 'Cannot ban yourself' })
  })

  it('returns error when user not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    const result = await toggleUserBan('u2')
    expect(result).toEqual({ error: 'User not found' })
  })

  it('toggles ban status', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'u2', banned: false } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const result = await toggleUserBan('u2')

    expect(result).toEqual({ success: true, banned: true })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { banned: true },
    })
  })
})

describe('updateUserRole', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'talent' } } as any)
    const result = await updateUserRole('u2', 'admin')
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('prevents self-role-change', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    const result = await updateUserRole('u1', 'talent')
    expect(result).toEqual({ error: 'Cannot change your own role' })
  })

  it('rejects invalid role', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    const result = await updateUserRole('u2', 'superadmin')
    expect(result).toEqual({ error: 'Invalid role' })
  })

  it('updates role', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'u1', role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const result = await updateUserRole('u2', 'client')

    expect(result).toEqual({ success: true })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { role: 'client' },
    })
  })
})

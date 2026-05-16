import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
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

// NEXT_REDIRECT is thrown by next/navigation redirect()
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')
let chooseRole: typeof import('@/actions/choose-role').chooseRole

beforeEach(async () => {
  vi.clearAllMocks()
  chooseRole = (await import('@/actions/choose-role')).chooseRole
})

describe('chooseRole', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    const formData = new FormData()
    const result = await chooseRole(formData)

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error for invalid role', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'guest-id', role: 'guest' } } as any)

    const formData = new FormData()
    formData.set('role', 'admin')
    const result = await chooseRole(formData)

    expect(result).toEqual({ error: 'Please select a role' })
  })

  it('returns error when role is empty', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'guest-id', role: 'guest' } } as any)

    const formData = new FormData()
    const result = await chooseRole(formData)

    expect(result).toEqual({ error: 'Please select a role' })
  })

  it('updates role to talent and redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'guest-id', role: 'guest' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('role', 'talent')

    await expect(chooseRole(formData)).rejects.toThrow('NEXT_REDIRECT')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'guest-id' },
      data: { role: 'talent' },
    })
  })

  it('updates role to client and redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'guest-id', role: 'guest' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('role', 'client')

    await expect(chooseRole(formData)).rejects.toThrow('NEXT_REDIRECT')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'guest-id' },
      data: { role: 'client' },
    })
  })
})

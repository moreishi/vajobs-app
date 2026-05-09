import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    clientProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    jobPost: { count: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let updateClientProfile: typeof import('@/actions/client-profile').updateClientProfile
let getMyClientProfile: typeof import('@/actions/client-profile').getMyClientProfile
let getClientProfile: typeof import('@/actions/client-profile').getClientProfile

const mockClientUser = {
  id: 'client-id',
  email: 'client@example.com',
  role: 'client',
  name: 'Test Client',
  password: 'hashed',
  emailVerified: null,
  image: null,
  connects: 0,
  lastConnectsReset: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTalentUser = {
  ...mockClientUser,
  id: 'talent-id',
  email: 'talent@example.com',
  role: 'talent',
  name: 'Test Talent',
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/client-profile')
  updateClientProfile = mod.updateClientProfile
  getMyClientProfile = mod.getMyClientProfile
  getClientProfile = mod.getClientProfile
})

describe('updateClientProfile', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await updateClientProfile(formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when role is not client or admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const formData = new FormData()
    const result = await updateClientProfile(formData)
    expect(result).toEqual({ error: 'Only clients can edit client profiles' })
  })

  it('upserts profile for client user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    formData.set('company', 'ACME Corp')
    formData.set('title', 'CEO')
    formData.set('bio', 'We build things')

    const result = await updateClientProfile(formData)

    expect(prisma.clientProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'client-id' },
      create: { userId: 'client-id', company: 'ACME Corp', title: 'CEO', bio: 'We build things' },
      update: { company: 'ACME Corp', title: 'CEO', bio: 'We build things' },
    })
    expect(result).toEqual({ success: true })
  })

  it('trims empty strings to null', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    formData.set('company', '  ')
    formData.set('title', 'CEO')
    formData.set('bio', '')

    const result = await updateClientProfile(formData)

    expect(prisma.clientProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'client-id' },
      create: { userId: 'client-id', company: null, title: 'CEO', bio: null },
      update: { company: null, title: 'CEO', bio: null },
    })
    expect(result).toEqual({ success: true })
  })

  it('allows admin to update client profile', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'admin-id', role: 'admin' } } as any)
    const formData = new FormData()
    formData.set('company', 'Admin Corp')

    const result = await updateClientProfile(formData)

    expect(result).toEqual({ success: true })
    expect(prisma.clientProfile.upsert).toHaveBeenCalled()
  })
})

describe('getMyClientProfile', () => {
  it('returns null when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getMyClientProfile()
    expect(result).toBeNull()
  })

  it('returns client profile for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    const mockProfile = {
      id: 'profile-id',
      userId: 'client-id',
      company: 'ACME Corp',
      title: 'CEO',
      bio: 'We build things',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(prisma.clientProfile.findUnique).mockResolvedValueOnce(mockProfile)

    const result = await getMyClientProfile()

    expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'client-id' },
    })
    expect(result).toEqual(mockProfile)
  })

  it('returns null when no profile exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.clientProfile.findUnique).mockResolvedValueOnce(null)

    const result = await getMyClientProfile()

    expect(result).toBeNull()
  })
})

describe('getClientProfile', () => {
  it('returns null when profile not found', async () => {
    vi.mocked(prisma.clientProfile.findUnique).mockResolvedValueOnce(null)

    const result = await getClientProfile('client-id')

    expect(result).toBeNull()
  })

  it('returns profile with user data and job count', async () => {
    const mockProfile = {
      id: 'profile-id',
      userId: 'client-id',
      company: 'ACME Corp',
      title: 'CEO',
      bio: 'We build things',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'client-id', name: 'Test Client', email: 'client@example.com', image: null },
    }
    vi.mocked(prisma.clientProfile.findUnique).mockResolvedValueOnce(mockProfile)
    vi.mocked(prisma.jobPost.count).mockResolvedValueOnce(5)

    const result = await getClientProfile('client-id')

    expect(prisma.clientProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'client-id' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })
    expect(prisma.jobPost.count).toHaveBeenCalledWith({
      where: { posterId: 'client-id', status: 'open' },
    })
    expect(result).toEqual({ ...mockProfile, jobCount: 5 })
  })

  it('returns profile with zero job count when no open jobs', async () => {
    const mockProfile = {
      id: 'profile-id',
      userId: 'client-id',
      company: 'ACME Corp',
      title: 'CEO',
      bio: 'We build things',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'client-id', name: 'Test Client', email: 'client@example.com', image: null },
    }
    vi.mocked(prisma.clientProfile.findUnique).mockResolvedValueOnce(mockProfile)
    vi.mocked(prisma.jobPost.count).mockResolvedValueOnce(0)

    const result = await getClientProfile('client-id')

    expect(result?.jobCount).toBe(0)
  })
})

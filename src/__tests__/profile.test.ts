import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn() },
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

let updateProfile: typeof import('@/actions/profile').updateProfile
let getMyProfile: typeof import('@/actions/profile').getMyProfile
let getProfile: typeof import('@/actions/profile').getProfile
let searchTalents: typeof import('@/actions/profile').searchTalents

const mockProfile = {
  id: 'profile-id',
  userId: 'talent-id',
  headline: 'Senior React Developer',
  bio: 'I build great web apps',
  skills: '["React","TypeScript","Node.js"]',
  hourlyRate: 80,
  experience: 5,
  availability: 'available',
  isPublic: true,
  resumeUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/profile')
  updateProfile = mod.updateProfile
  getMyProfile = mod.getMyProfile
  getProfile = mod.getProfile
  searchTalents = mod.searchTalents
})

describe('updateProfile', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await updateProfile(formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not talent', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    const result = await updateProfile(formData)
    expect(result).toEqual({ error: 'Only talents can edit profiles' })
  })

  it('upserts profile and redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.profile.upsert).mockResolvedValueOnce(mockProfile as any)

    const formData = new FormData()
    formData.set('headline', 'Senior React Developer')
    formData.set('bio', 'I build great web apps')
    formData.set('skills', 'React, TypeScript, Node.js')
    formData.set('hourlyRate', '80')
    formData.set('experience', '5')
    formData.set('availability', 'available')
    formData.set('isPublic', 'on')

    await updateProfile(formData)

    expect(prisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'talent-id' },
      create: {
        userId: 'talent-id',
        headline: 'Senior React Developer',
        bio: 'I build great web apps',
        skills: JSON.stringify(['React', 'TypeScript', 'Node.js']),
        hourlyRate: 80,
        experience: 5,
        availability: 'available',
        isPublic: true,
        resumeUrl: null,
      },
      update: {
        headline: 'Senior React Developer',
        bio: 'I build great web apps',
        skills: JSON.stringify(['React', 'TypeScript', 'Node.js']),
        hourlyRate: 80,
        experience: 5,
        availability: 'available',
        isPublic: true,
        resumeUrl: null,
      },
    })
    const { redirect } = await import('next/navigation')
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('handles resumeUrl field', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.profile.upsert).mockResolvedValueOnce(mockProfile as any)

    const formData = new FormData()
    formData.set('resumeUrl', '/uploads/resume.pdf')

    await updateProfile(formData)

    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ resumeUrl: '/uploads/resume.pdf' }),
        update: expect.objectContaining({ resumeUrl: '/uploads/resume.pdf' }),
      })
    )
  })

  it('returns error for invalid availability', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const formData = new FormData()
    formData.set('availability', 'invalid')
    const result = await updateProfile(formData)
    expect(result).toEqual({ error: 'Invalid availability value' })
  })

  it('sets profile to private when checkbox is off', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.profile.upsert).mockResolvedValueOnce(mockProfile as any)

    const formData = new FormData()
    formData.set('isPublic', 'off')

    await updateProfile(formData)

    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ isPublic: false }),
        update: expect.objectContaining({ isPublic: false }),
      })
    )
  })
})

describe('getMyProfile', () => {
  it('returns null when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getMyProfile()
    expect(result).toBeNull()
  })

  it('returns null when no profile exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(null)
    const result = await getMyProfile()
    expect(result).toBeNull()
  })

  it('returns profile with parsed skills', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce({
      ...mockProfile,
      user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
    })

    const result = await getMyProfile()

    expect(result).not.toBeNull()
    expect(result?.skills).toEqual(['React', 'TypeScript', 'Node.js'])
    expect(result?.headline).toBe('Senior React Developer')
    expect(result?.user.name).toBe('Talent')
  })
})

describe('getProfile', () => {
  it('returns null when profile not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce(null)
    const result = await getProfile('nonexistent-id')
    expect(result).toBeNull()
  })

  it('returns null when profile is private and viewer is not owner', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce({
      ...mockProfile,
      isPublic: false,
      user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
    })
    const result = await getProfile('talent-id')
    expect(result).toBeNull()
  })

  it('returns profile when owner views private profile', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce({
      ...mockProfile,
      isPublic: false,
      user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
    })
    const result = await getProfile('talent-id')
    expect(result).not.toBeNull()
    expect(result?.isPublic).toBe(false)
  })

  it('returns public profile for any viewer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce({
      ...mockProfile,
      user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
    })
    const result = await getProfile('talent-id')
    expect(result).not.toBeNull()
    expect(result?.headline).toBe('Senior React Developer')
  })
})

describe('searchTalents', () => {
  it('returns only public profiles', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([])
    const result = await searchTalents({})
    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      })
    )
    expect(result).toEqual({ profiles: [], total: 0 })
  })

  it('filters by query in headline', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
      {
        ...mockProfile,
        user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
      },
      {
        ...mockProfile,
        userId: 'other-id',
        headline: 'Python Developer',
        skills: '["Python"]',
        user: { id: 'other-id', name: 'Other', email: 'other@example.com', image: null },
      },
    ])

    const result = await searchTalents({ query: 'react' })

    expect(result.profiles).toHaveLength(1)
    expect(result.profiles[0].headline).toBe('Senior React Developer')
  })

  it('filters by skills parameter', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
      {
        ...mockProfile,
        skills: '["React","TypeScript"]',
        user: { id: 'talent-id', name: 'Talent', email: 'talent@example.com', image: null },
      },
      {
        ...mockProfile,
        userId: 'other-id',
        skills: '["Python"]',
        user: { id: 'other-id', name: 'Other', email: 'other@example.com', image: null },
      },
    ])

    const result = await searchTalents({ skills: 'TypeScript' })

    expect(result.profiles).toHaveLength(1)
    expect(result.profiles[0].userId).toBe('talent-id')
  })

  it('filters by availability', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([])

    await searchTalents({ availability: 'busy' })

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true, availability: 'busy' }),
      })
    )
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    jobPost: {
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    connectTransaction: {
      create: vi.fn(),
    },
    referralReward: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/actions/notifications', () => ({
  createNotification: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')
let seedJobs: typeof import('@/actions/jobs').seedJobs
let createJob: typeof import('@/actions/jobs').createJob

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/jobs')
  seedJobs = mod.seedJobs
  createJob = mod.createJob
})

describe('seedJobs', () => {
  it('returns error when no users exist', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)

    const result = await seedJobs()
    expect(result).toEqual({ error: 'No users found. Create at least one user first.' })
  })

  it('creates 5 jobs for a client user', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      password: 'hashed',
      role: 'client',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.jobPost.createMany).mockResolvedValueOnce({ count: 5 })

    const result = await seedJobs()

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { role: { in: ['client', 'admin'] } },
      orderBy: { createdAt: 'asc' },
    })

    expect(prisma.jobPost.createMany).toHaveBeenCalledOnce()
    const createCall = vi.mocked(prisma.jobPost.createMany).mock.calls[0][0]
    expect(createCall.data).toHaveLength(5)
    expect(createCall.data[0]).toMatchObject({
      title: 'Senior Frontend Developer',
      posterId: 'client-id',
      posterName: 'client',
      status: 'open',
      type: 'full-time',
    })

    expect(result).toEqual({ success: true, message: '5 sample jobs created!' })
  })

  it('creates 5 jobs for an admin user', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 'admin-id',
      email: 'admin@vajobs.online',
      password: 'hashed',
      role: 'admin',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.jobPost.createMany).mockResolvedValueOnce({ count: 5 })

    const result = await seedJobs()

    expect(result).toEqual({ success: true, message: '5 sample jobs created!' })
    expect(prisma.jobPost.createMany).toHaveBeenCalledOnce()
  })

  it('stores skills as JSON string', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      password: 'hashed',
      role: 'client',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.jobPost.createMany).mockResolvedValueOnce({ count: 5 })

    await seedJobs()

    const createCall = vi.mocked(prisma.jobPost.createMany).mock.calls[0][0]
    const skills = JSON.parse(createCall.data[0].skills as string)
    expect(Array.isArray(skills)).toBe(true)
    expect(skills).toContain('React')
    expect(skills).toContain('TypeScript')
  })
})

describe('createJob', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await createJob(formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when role is not client', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const formData = new FormData()
    const result = await createJob(formData)
    expect(result).toEqual({ error: 'Only clients can create job posts' })
  })

  it('returns error when title is too short', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    formData.set('title', 'Ab')
    const result = await createJob(formData)
    expect(result).toEqual({ error: 'Title must be at least 3 characters' })
  })

  it('returns error when description is too short', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    formData.set('title', 'Senior Dev')
    formData.set('description', 'Too short')
    const result = await createJob(formData)
    expect(result).toEqual({ error: 'Description must be at least 20 characters' })
  })

  it('returns error for invalid job type', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    formData.set('title', 'Senior Dev')
    formData.set('description', 'A longer description that meets the minimum length requirement.')
    formData.set('type', 'invalid-type')
    const result = await createJob(formData)
    expect(result).toEqual({ error: 'Invalid job type' })
  })

  it('creates job post with valid data and redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('title', 'Senior Frontend Developer')
    formData.set('description', 'We are looking for an experienced frontend developer to join our team building modern web applications.')
    formData.set('type', 'full-time')
    formData.set('location', 'Remote')
    formData.set('salaryRange', '$120k - $160k')
    formData.set('skills', 'React, TypeScript, Next.js')

    await createJob(formData)

    expect(prisma.jobPost.create).toHaveBeenCalledWith({
      data: {
        title: 'Senior Frontend Developer',
        description: 'We are looking for an experienced frontend developer to join our team building modern web applications.',
        shortDescription: null,
        location: 'Remote',
        type: 'full-time',
        salaryRange: '$120k - $160k',
        skills: JSON.stringify(['React', 'TypeScript', 'Next.js']),
        status: 'open',
        posterId: 'client-id',
        posterName: 'Client',
      },
    })
  })

  it('creates job as draft when specified', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('title', 'Senior Frontend Developer')
    formData.set('description', 'We are looking for an experienced frontend developer to join our team building modern web applications.')
    formData.set('type', 'full-time')
    formData.set('status', 'draft')

    await createJob(formData)

    expect(prisma.jobPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'draft' }),
    })
  })

  it('grants referral reward on first job post when referred', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
      referredById: 'referrer-id',
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.jobPost.count).mockResolvedValueOnce(1)

    const formData = new FormData()
    formData.set('title', 'Senior Frontend Developer')
    formData.set('description', 'We are looking for an experienced frontend developer to join our team building modern web applications.')
    formData.set('type', 'full-time')

    await createJob(formData)

    expect(prisma.jobPost.count).toHaveBeenCalledWith({
      where: { posterId: 'client-id' },
    })
  })

  it('does not grant reward on subsequent job posts', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
      referredById: 'referrer-id',
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.jobPost.count).mockResolvedValueOnce(2)

    const formData = new FormData()
    formData.set('title', 'Senior Dev')
    formData.set('description', 'We are looking for an experienced developer to join our team building modern web applications.')
    formData.set('type', 'full-time')

    await createJob(formData)

    expect(prisma.referralReward.findUnique).not.toHaveBeenCalled()
  })

  it('does not grant reward for non-referred client', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
      referredById: null,
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('title', 'Senior Dev')
    formData.set('description', 'We are looking for an experienced developer to join our team building modern web applications.')
    formData.set('type', 'full-time')

    await createJob(formData)
  })

  it('preserves skills order from input', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'client-id',
      email: 'client@example.com',
      name: null,
    } as any)
    vi.mocked(prisma.jobPost.create).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('title', 'Senior Frontend Developer')
    formData.set('description', 'We are looking for an experienced frontend developer to join our team building modern web applications.')
    formData.set('type', 'full-time')
    formData.set('skills', '  React  ,  TypeScript  ,  Next.js  ,  Tailwind  ')

    await createJob(formData)

    const createCall = vi.mocked(prisma.jobPost.create).mock.calls[0][0]
    const skills = JSON.parse(createCall.data.skills as string)
    expect(skills).toEqual(['React', 'TypeScript', 'Next.js', 'Tailwind'])
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobPost: { findUnique: vi.fn() },
    profile: { findMany: vi.fn() },
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

const mockClient = { user: { id: 'client-1', role: 'client' } }
const mockAdmin = { user: { id: 'admin-1', role: 'admin' } }
const mockTalent = { user: { id: 'talent-1', role: 'talent' } }

const mockJob = {
  id: 'job-1',
  skills: JSON.stringify(['React', 'TypeScript', 'Node.js']),
  posterId: 'client-1',
}

const mockProfiles = [
  {
    id: 'profile-1',
    userId: 'user-1',
    headline: 'Senior React Developer',
    bio: 'Experienced with React and TypeScript',
    skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'GraphQL']),
    experience: 5,
    hourlyRate: 80,
    verified: true,
    user: { name: 'Alice', email: 'alice@test.com' },
  },
  {
    id: 'profile-2',
    userId: 'user-2',
    headline: 'Backend Engineer',
    bio: 'Node.js and Python expert',
    skills: JSON.stringify(['Node.js', 'Python', 'PostgreSQL']),
    experience: 3,
    hourlyRate: 60,
    verified: false,
    user: { name: 'Bob', email: 'bob@test.com' },
  },
  {
    id: 'profile-3',
    userId: 'user-3',
    headline: 'Designer',
    bio: 'UI/UX designer',
    skills: JSON.stringify(['Figma', 'Sketch', 'Photoshop']),
    experience: 4,
    hourlyRate: 50,
    verified: false,
    user: { name: 'Carol', email: 'carol@test.com' },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('findMatchingTalents', () => {
  it('returns error when not authenticated', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await findMatchingTalents('job-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not client or admin', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    const result = await findMatchingTalents('job-1')
    expect(result).toEqual({ error: 'Only clients can find matching talents' })
  })

  it('returns error when job not found', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(null)
    const result = await findMatchingTalents('job-1')
    expect(result).toEqual({ error: 'Job not found' })
  })

  it('returns empty when job has no skills', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce({ id: 'job-1', skills: '[]', posterId: 'client-1' } as any)
    const result = await findMatchingTalents('job-1')
    expect(result).toEqual({ success: true, data: [] })
  })

  it('returns matching talents ranked by score', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce(mockProfiles as any)

    const result = await findMatchingTalents('job-1')
    expect('data' in result && result.success).toBe(true)
    if (!('data' in result)) return

    // Alice: 3/4 matched → 75%
    // Bob: 1/3 matched → 33%
    // Carol: 0 matched → should not appear
    expect(result.data.length).toBe(2)
    expect(result.data[0].name).toBe('Alice')
    expect(result.data[0].matchScore).toBeGreaterThan(50)
    expect(result.data[1].name).toBe('Bob')
    expect(result.data[1].matchScore).toBeLessThan(50)
  })

  it('allows admin to find matches for any job', async () => {
    const { findMatchingTalents } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockAdmin as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce(mockProfiles as any)

    const result = await findMatchingTalents('job-1')
    expect('data' in result && result.success).toBe(true)
  })
})

describe('enrichMatchingWithAI', () => {
  const enrichParams = {
    jobPostId: 'job-1',
    provider: 'openai' as const,
    apiKey: 'sk-test',
    model: 'gpt-4o',
  }

  it('returns error when apiKey is missing', async () => {
    const { enrichMatchingWithAI } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce(mockProfiles as any)

    const result = await enrichMatchingWithAI({ ...enrichParams, apiKey: '' })
    expect(result).toEqual({ error: 'API key is required' })
  })

  it('handles AI enrichment with valid data', async () => {
    const { enrichMatchingWithAI } = await import('@/actions/talent-matching')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    // findMatchingTalents calls: jobPost.findUnique, profile.findMany
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce(mockProfiles as any)
    // enrichMatchingWithAI calls: jobPost.findUnique again for job details
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({
          matches: [
            { candidateIndex: 0, rank: 1, reason: 'Strong React and TypeScript experience' },
            { candidateIndex: 1, rank: 2, reason: 'Has Node.js background' },
          ],
        }) } }],
      }),
    } as any)

    const result = await enrichMatchingWithAI(enrichParams)
    expect('data' in result && result.success).toBe(true)
    if (!('data' in result)) return

    expect(result.data.length).toBe(2)
    expect(result.data[0].aiReason).toBe('Strong React and TypeScript experience')
    expect(result.data[1].aiReason).toBe('Has Node.js background')
  })
})

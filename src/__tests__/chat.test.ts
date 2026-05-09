import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn() },
    message: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let getMessages: typeof import('@/actions/chat').getMessages

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/chat')
  getMessages = mod.getMessages
})

describe('getMessages', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getMessages('app-id')
    expect(result).toEqual([])
  })

  it('returns empty array when application not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const result = await getMessages('app-id')
    expect(result).toEqual([])
  })

  it('returns empty array when user is not a participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app-id',
      applicantId: 'talent-id',
      jobPost: { posterId: 'client-id' },
    })
    const result = await getMessages('app-id')
    expect(result).toEqual([])
  })

  it('returns all messages for a participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app-id',
      applicantId: 'talent-id',
      jobPost: { posterId: 'client-id' },
    })
    const mockMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-id',
        senderId: 'client-id',
        content: 'Hello!',
        attachmentUrl: null,
        attachmentName: null,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        sender: { id: 'client-id', name: 'Client', email: 'client@example.com' },
      },
      {
        id: 'msg-2',
        conversationId: 'conv-id',
        senderId: 'talent-id',
        content: 'Hi there!',
        attachmentUrl: null,
        attachmentName: null,
        createdAt: new Date('2026-01-01T10:01:00Z'),
        sender: { id: 'talent-id', name: 'Talent', email: 'talent@example.com' },
      },
    ]
    vi.mocked(prisma.message.findMany).mockResolvedValueOnce(mockMessages as any)

    const result = await getMessages('app-id')

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { conversation: { applicationId: 'app-id' } },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, email: true } } },
    })
    expect(result).toHaveLength(2)
    expect(result[0].content).toBe('Hello!')
    expect(result[1].content).toBe('Hi there!')
  })

  it('filters messages after since timestamp', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app-id',
      applicantId: 'talent-id',
      jobPost: { posterId: 'client-id' },
    })
    vi.mocked(prisma.message.findMany).mockResolvedValueOnce([])

    const since = '2026-01-01T10:00:00Z'
    await getMessages('app-id', since)

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        conversation: { applicationId: 'app-id' },
        createdAt: { gt: new Date(since) },
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, email: true } } },
    })
  })
})

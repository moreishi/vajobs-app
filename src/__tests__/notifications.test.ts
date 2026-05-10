import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    notification: { create: vi.fn(), count: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    notificationPreference: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')
const { sendEmail } = await import('@/lib/email')

let createNotification: typeof import('@/actions/notifications').createNotification
let getUnreadCount: typeof import('@/actions/notifications').getUnreadCount
let getNotifications: typeof import('@/actions/notifications').getNotifications
let markAsRead: typeof import('@/actions/notifications').markAsRead
let markAllAsRead: typeof import('@/actions/notifications').markAllAsRead

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/notifications')
  createNotification = mod.createNotification
  getUnreadCount = mod.getUnreadCount
  getNotifications = mod.getNotifications
  markAsRead = mod.markAsRead
  markAllAsRead = mod.markAllAsRead
})

describe('createNotification', () => {
  const baseParams = {
    userId: 'user-id',
    type: 'application_received' as const,
    title: 'New Application',
    body: 'Someone applied to your job',
  }

  it('creates notification record', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'test@example.com', name: 'Test' } as any)
    vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any)

    await createNotification(baseParams)

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-id', type: 'application_received', title: 'New Application', body: 'Someone applied to your job', link: undefined },
    })
  })

  it('creates notification with link', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'test@example.com', name: 'Test' } as any)
    vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any)

    await createNotification({ ...baseParams, link: '/dashboard' })

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-id', type: 'application_received', title: 'New Application', body: 'Someone applied to your job', link: '/dashboard' },
    })
  })

  it('does not block on email send failure', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'test@example.com', name: 'Test' } as any)
    vi.stubEnv('RESEND_API_KEY', 're_abc123')

    await expect(createNotification(baseParams)).resolves.not.toThrow()
    vi.unstubAllEnvs()
  })
})

describe('getUnreadCount', () => {
  it('returns 0 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getUnreadCount()
    expect(result).toBe(0)
  })

  it('returns unread count for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.notification.count).mockResolvedValueOnce(3)

    const result = await getUnreadCount()

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-id', read: false },
    })
    expect(result).toBe(3)
  })

  it('returns 0 when no unread notifications', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.notification.count).mockResolvedValueOnce(0)

    const result = await getUnreadCount()
    expect(result).toBe(0)
  })
})

describe('getNotifications', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getNotifications()
    expect(result).toEqual([])
  })

  it('returns recent notifications', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    const mockNotifs = [
      { id: 'notif-1', userId: 'user-id', type: 'application_received', title: 'New App', body: null, link: null, read: false, createdAt: new Date() },
      { id: 'notif-2', userId: 'user-id', type: 'status_updated', title: 'Status Changed', body: null, link: null, read: true, createdAt: new Date() },
    ]
    vi.mocked(prisma.notification.findMany).mockResolvedValueOnce(mockNotifs)

    const result = await getNotifications()

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    expect(result).toEqual(mockNotifs)
  })
})

describe('markAsRead', () => {
  it('does nothing when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    await markAsRead('notif-id')
    expect(prisma.notification.update).not.toHaveBeenCalled()
  })

  it('marks a single notification as read', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.notification.update).mockResolvedValueOnce({} as any)

    await markAsRead('notif-id')

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-id', userId: 'user-id' },
      data: { read: true },
    })
  })
})

describe('markAllAsRead', () => {
  it('does nothing when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    await markAllAsRead()
    expect(prisma.notification.updateMany).not.toHaveBeenCalled()
  })

  it('marks all notifications as read', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-id' } } as any)
    vi.mocked(prisma.notification.updateMany).mockResolvedValueOnce({ count: 5 })

    await markAllAsRead()

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', read: false },
      data: { read: true },
    })
  })
})

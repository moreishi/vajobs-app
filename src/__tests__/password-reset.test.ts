import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')

let forgotPassword: typeof import('@/actions/password-reset').forgotPassword
let resetPassword: typeof import('@/actions/password-reset').resetPassword

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/password-reset')
  forgotPassword = mod.forgotPassword
  resetPassword = mod.resetPassword
})

describe('forgotPassword', () => {
  it('returns error when email is missing', async () => {
    const formData = new FormData()
    const result = await forgotPassword(formData)
    expect(result).toEqual({ error: 'Email is required' })
  })

  it('returns success when user not found (prevents enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('email', 'nonexistent@example.com')
    const result = await forgotPassword(formData)
    expect(result).toEqual({ success: true })
  })

  it('returns success when user has no password (OAuth only)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-id',
      email: 'oauth@example.com',
      password: null,
    })
    const formData = new FormData()
    formData.set('email', 'oauth@example.com')
    const result = await forgotPassword(formData)
    expect(result).toEqual({ success: true })
  })

  it('creates verification token and sends email for valid user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashed-password',
    } as any)
    vi.mocked(prisma.verificationToken.create).mockResolvedValueOnce({} as any)

    const { sendEmail } = await import('@/lib/email')

    const formData = new FormData()
    formData.set('email', 'user@example.com')
    const result = await forgotPassword(formData)

    expect(result).toEqual({ success: true })
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { identifier: 'user@example.com' } })
    expect(prisma.verificationToken.create).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Reset'),
      })
    )
  })
})

describe('resetPassword', () => {
  it('returns error when token is missing', async () => {
    const formData = new FormData()
    formData.set('password', 'newpassword123')
    formData.set('confirmPassword', 'newpassword123')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Token and password are required' })
  })

  it('returns error when password is missing', async () => {
    const formData = new FormData()
    formData.set('token', 'some-token')
    formData.set('confirmPassword', 'newpassword123')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Token and password are required' })
  })

  it('returns error when password is too short', async () => {
    const formData = new FormData()
    formData.set('token', 'some-token')
    formData.set('password', '12345')
    formData.set('confirmPassword', '12345')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Password must be at least 6 characters' })
  })

  it('returns error when passwords do not match', async () => {
    const formData = new FormData()
    formData.set('token', 'some-token')
    formData.set('password', 'newpassword123')
    formData.set('confirmPassword', 'differentpassword')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Passwords do not match' })
  })

  it('returns error when token not found', async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('token', 'invalid-token')
    formData.set('password', 'newpassword123')
    formData.set('confirmPassword', 'newpassword123')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Invalid or expired reset token' })
  })

  it('returns error when token expired', async () => {
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 2)
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
      identifier: 'user@example.com',
      token: 'expired-token',
      expires: expiredDate,
    })
    const formData = new FormData()
    formData.set('token', 'expired-token')
    formData.set('password', 'newpassword123')
    formData.set('confirmPassword', 'newpassword123')
    const result = await resetPassword(formData)
    expect(result).toEqual({ error: 'Invalid or expired reset token' })
  })

  it('updates password and deletes token on success', async () => {
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 2)
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
      identifier: 'user@example.com',
      token: 'valid-token',
      expires: futureDate,
    })
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}])

    const formData = new FormData()
    formData.set('token', 'valid-token')
    formData.set('password', 'newpassword123')
    formData.set('confirmPassword', 'newpassword123')
    const result = await resetPassword(formData)

    expect(result).toEqual({ success: true })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

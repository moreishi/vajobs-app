import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hash, compare } from 'bcryptjs'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    jobPost: {
      createMany: vi.fn(),
    },
    notificationPreference: {
      createMany: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}))

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')

let signUp: typeof import('@/actions/auth').signUp
let seedAdmin: typeof import('@/actions/auth').seedAdmin
let signInWithEmail: typeof import('@/actions/auth').signInWithEmail
let verifyEmail: typeof import('@/actions/auth').verifyEmail

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/auth')
  signUp = mod.signUp
  seedAdmin = mod.seedAdmin
  signInWithEmail = mod.signInWithEmail
  verifyEmail = mod.verifyEmail
})

describe('signUp', () => {
  it('returns error when email is missing', async () => {
    const formData = new FormData()
    formData.set('password', 'password123')
    formData.set('role', 'talent')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error when password is missing', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('role', 'talent')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error when role is invalid', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('role', 'invalid')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'Please select a role (Talent or Client)' })
  })

  it('returns error when role is missing', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'Please select a role (Talent or Client)' })
  })

  it('returns error when password is too short', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', '12345')
    formData.set('role', 'talent')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'Password must be at least 6 characters' })
  })

  it('returns error when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'existing-id',
      email: 'test@example.com',
      password: 'hashed',
      role: 'talent',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('role', 'talent')

    const result = await signUp(formData)
    expect(result).toEqual({ error: 'An account with this email already exists' })
  })

  it('creates user with valid data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'new-id',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'client',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.notificationPreference.createMany).mockResolvedValueOnce({ count: 22 })

    const { redirect } = await import('next/navigation')

    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('role', 'client')

    await signUp(formData)

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        role: 'client',
        password: expect.any(String),
      }),
    })

    expect(redirect).toHaveBeenCalledWith('/login?checkEmail=true')
  })

  it('creates verification token and sends email when RESEND_API_KEY is set', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_abc123')
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'new-id',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'talent',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.notificationPreference.createMany).mockResolvedValueOnce({ count: 22 })
    vi.mocked(prisma.verificationToken.create).mockResolvedValueOnce({} as any)

    const { sendEmail } = await import('@/lib/email')
    const { redirect } = await import('next/navigation')

    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('role', 'talent')

    await signUp(formData)

    expect(prisma.verificationToken.create).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Verify'),
      })
    )
    expect(redirect).toHaveBeenCalledWith('/login?checkEmail=true')
    vi.unstubAllEnvs()
  })
})

describe('seedAdmin', () => {
  it('creates admin when not existing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
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

    const result = await seedAdmin()

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'admin@vajobs.online',
        role: 'admin',
        password: expect.any(String),
      }),
    })
    expect(result.success).toBe(true)
    expect(result.message).toContain('created successfully')
  })

  it('updates existing user to admin role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'existing-admin',
      email: 'admin@vajobs.online',
      password: 'old-hash',
      role: 'talent',
      name: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await seedAdmin()

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'admin@vajobs.online' },
      data: { role: 'admin' },
    })
    expect(result.success).toBe(true)
  })
})

describe('signInWithEmail', () => {
  it('returns error when email is missing', async () => {
    const formData = new FormData()
    formData.set('password', 'password123')

    const result = await signInWithEmail(formData)
    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error when password is missing', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')

    const result = await signInWithEmail(formData)
    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error on invalid credentials', async () => {
    const { signIn } = await import('@/lib/auth')
    vi.mocked(signIn).mockRejectedValueOnce(new Error('Invalid credentials'))

    const formData = new FormData()
    formData.set('email', 'wrong@example.com')
    formData.set('password', 'wrong-password')

    const result = await signInWithEmail(formData)
    expect(result).toEqual({ error: 'Invalid email or password' })
  })

  it('signs in with valid credentials', async () => {
    const { signIn } = await import('@/lib/auth')
    const { redirect } = await import('next/navigation')
    vi.mocked(signIn).mockResolvedValueOnce({} as any)

    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')

    await signInWithEmail(formData)

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    })
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('returns error when email not verified', async () => {
    const { signIn } = await import('@/lib/auth')
    vi.mocked(signIn).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      emailVerified: null,
    })

    const formData = new FormData()
    formData.set('email', 'unverified@example.com')
    formData.set('password', 'password123')

    const result = await signInWithEmail(formData)
    expect(result).toEqual({
      error: 'Please verify your email before signing in. Check your inbox for the verification link.',
    })
  })
})

describe('verifyEmail', () => {
  it('returns error when token is empty', async () => {
    const result = await verifyEmail('')
    expect(result).toEqual({ error: 'Verification token is required' })
  })

  it('returns error when token not found', async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce(null)
    const result = await verifyEmail('invalid-token')
    expect(result).toEqual({ error: 'Invalid verification link' })
  })

  it('returns error when token expired', async () => {
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 2)
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
      identifier: 'user@example.com',
      token: 'expired-token',
      expires: expiredDate,
    })
    vi.mocked(prisma.verificationToken.delete).mockResolvedValueOnce({} as any)

    const result = await verifyEmail('expired-token')
    expect(result).toEqual({
      error: 'Verification link has expired. Please sign up again.',
    })
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    })
  })

  it('verifies email successfully', async () => {
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 2)
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
      identifier: 'user@example.com',
      token: 'valid-token',
      expires: futureDate,
    })
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}])

    const result = await verifyEmail('valid-token')

    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.user.update({
        where: { email: 'user@example.com' },
        data: { emailVerified: expect.any(Date) },
      }),
      prisma.verificationToken.delete({
        where: { token: 'valid-token' },
      }),
    ])
    expect(result).toEqual({ success: true })
  })
})

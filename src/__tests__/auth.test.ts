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
  },
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

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/auth')
  signUp = mod.signUp
  seedAdmin = mod.seedAdmin
  signInWithEmail = mod.signInWithEmail
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
})

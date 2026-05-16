import { describe, it, expect, vi, beforeEach } from 'vitest'

// Default: NODE_ENV not set → development → no mode
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

beforeEach(() => {
  vi.resetModules()
})

describe('ci (case-insensitive contains)', () => {
  it('returns bare contains in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const { ci } = await import('@/lib/db-utils')
    const result = ci('hello')

    expect(result).toEqual({ contains: 'hello' })
  })

  it('returns bare contains when NODE_ENV is unset', async () => {
    vi.stubEnv('NODE_ENV', '')

    const { ci } = await import('@/lib/db-utils')
    const result = ci('test')

    expect(result).toEqual({ contains: 'test' })
  })

  it('returns contains with mode insensitive in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { ci } = await import('@/lib/db-utils')
    const result = ci('python')

    expect(result).toEqual({ contains: 'python', mode: 'insensitive' })
  })

  it('handles special characters in query', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { ci } = await import('@/lib/db-utils')
    const result = ci('C++ Developer')

    expect(result).toEqual({ contains: 'C++ Developer', mode: 'insensitive' })
  })
})

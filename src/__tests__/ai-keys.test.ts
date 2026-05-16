import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiApiKey: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((s: string) => `encrypted:${s}`),
  decrypt: vi.fn((s: string) => s.replace('encrypted:', '')),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let getSavedApiKey: typeof import('@/actions/ai-keys').getSavedApiKey
let getAllSavedApiKeys: typeof import('@/actions/ai-keys').getAllSavedApiKeys
let saveApiKey: typeof import('@/actions/ai-keys').saveApiKey
let deleteSavedApiKey: typeof import('@/actions/ai-keys').deleteSavedApiKey

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/ai-keys')
  getSavedApiKey = mod.getSavedApiKey
  getAllSavedApiKeys = mod.getAllSavedApiKeys
  saveApiKey = mod.saveApiKey
  deleteSavedApiKey = mod.deleteSavedApiKey
})

describe('getSavedApiKey', () => {
  it('returns null when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getSavedApiKey('openai')
    expect(result).toBeNull()
  })

  it('returns null when no saved key exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    vi.mocked(prisma.aiApiKey.findUnique).mockResolvedValueOnce(null)
    const result = await getSavedApiKey('openai')
    expect(result).toBeNull()
  })

  it('returns decrypted key when record exists', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    vi.mocked(prisma.aiApiKey.findUnique).mockResolvedValueOnce({
      id: 'key-1',
      userId: 'user-1',
      provider: 'openai',
      apiKey: 'encrypted:sk-real-key',
      baseUrl: null,
      model: 'gpt-4o',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const result = await getSavedApiKey('openai')
    expect(result).toEqual({
      id: 'key-1',
      provider: 'openai',
      apiKey: 'sk-real-key',
      baseUrl: null,
      model: 'gpt-4o',
    })
  })
})

describe('getAllSavedApiKeys', () => {
  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getAllSavedApiKeys()
    expect(result).toEqual([])
  })

  it('returns all saved keys', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    vi.mocked(prisma.aiApiKey.findMany).mockResolvedValueOnce([
      { id: 'k1', userId: 'user-1', provider: 'openai', apiKey: 'encrypted:key1', baseUrl: null, model: 'gpt-4o', createdAt: new Date(), updatedAt: new Date() },
      { id: 'k2', userId: 'user-1', provider: 'anthropic', apiKey: 'encrypted:key2', baseUrl: null, model: 'claude-3', createdAt: new Date(), updatedAt: new Date() },
    ])
    const result = await getAllSavedApiKeys()
    expect(result).toHaveLength(2)
    expect(result[0].provider).toBe('openai')
    expect(result[1].provider).toBe('anthropic')
  })
})

describe('saveApiKey', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await saveApiKey('openai', 'sk-test')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('upserts encrypted key', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    vi.mocked(prisma.aiApiKey.upsert).mockResolvedValueOnce({} as any)

    const result = await saveApiKey('openai', 'sk-test', 'https://custom.com', 'gpt-4o')

    expect(result).toEqual({ success: true })
    expect(prisma.aiApiKey.upsert).toHaveBeenCalledWith({
      where: { userId_provider: { userId: 'user-1', provider: 'openai' } },
      create: { userId: 'user-1', provider: 'openai', apiKey: 'encrypted:sk-test', baseUrl: 'https://custom.com', model: 'gpt-4o' },
      update: { apiKey: 'encrypted:sk-test', baseUrl: 'https://custom.com', model: 'gpt-4o' },
    })
  })
})

describe('deleteSavedApiKey', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await deleteSavedApiKey('openai')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('deletes the key for the provider', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    const result = await deleteSavedApiKey('openai')
    expect(result).toEqual({ success: true })
    expect(prisma.aiApiKey.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', provider: 'openai' },
    })
  })
})

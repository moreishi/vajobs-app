import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe('getStorageProvider', () => {
  it('returns localStorageProvider when S3_BUCKET is not set', async () => {
    const { getStorageProvider } = await import('@/lib/storage')
    const { localStorageProvider } = await import('@/lib/storage/local')

    await expect(getStorageProvider()).resolves.toBe(localStorageProvider)
  })

  it('returns s3StorageProvider when S3_BUCKET is set', async () => {
    vi.stubEnv('S3_BUCKET', 'my-bucket')

    const { getStorageProvider } = await import('@/lib/storage')
    const provider = await getStorageProvider()

    expect(provider.save).toBeDefined()
    expect(provider.delete).toBeDefined()
    expect(provider.getUrl).toBeDefined()
  })

  it('caches the provider instance', async () => {
    const { getStorageProvider } = await import('@/lib/storage')
    const a = await getStorageProvider()
    const b = await getStorageProvider()

    expect(a).toBe(b)
  })
})

describe('localStorageProvider', () => {
  it('getUrl returns /uploads/ prefixed path', async () => {
    const { localStorageProvider } = await import('@/lib/storage/local')

    expect(localStorageProvider.getUrl('abc123.pdf')).toBe('/uploads/abc123.pdf')
  })

  it('getUrl strips directory traversal', async () => {
    const { localStorageProvider } = await import('@/lib/storage/local')

    const url = localStorageProvider.getUrl('../../etc/passwd')
    expect(url).toBe('/uploads/passwd')
  })
})

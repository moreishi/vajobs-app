import type { StorageProvider } from './types'
import { localStorageProvider } from './local'

let cachedProvider: StorageProvider | null = null

export async function getStorageProvider(): Promise<StorageProvider> {
  if (cachedProvider) return cachedProvider

  if (process.env.S3_BUCKET) {
    const { s3StorageProvider } = await import('./s3')
    cachedProvider = s3StorageProvider
  } else {
    cachedProvider = localStorageProvider
  }

  return cachedProvider
}

export type { StorageProvider }

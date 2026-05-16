'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'

type Provider = 'openai' | 'anthropic' | 'deepseek' | 'custom'

export async function getSavedApiKey(provider: Provider) {
  const session = await auth()
  if (!session?.user?.id) return null

  const record = await prisma.aiApiKey.findUnique({
    where: { userId_provider: { userId: session.user.id, provider } },
  })

  if (!record) return null

  return {
    id: record.id,
    provider: record.provider as Provider,
    apiKey: decrypt(record.apiKey),
    baseUrl: record.baseUrl,
    model: record.model,
  }
}

export async function getAllSavedApiKeys() {
  const session = await auth()
  if (!session?.user?.id) return []

  const records = await prisma.aiApiKey.findMany({
    where: { userId: session.user.id },
  })

  return records.map((r) => ({
    id: r.id,
    provider: r.provider as Provider,
    apiKey: decrypt(r.apiKey),
    baseUrl: r.baseUrl,
    model: r.model,
  }))
}

export async function saveApiKey(
  provider: Provider,
  apiKey: string,
  baseUrl?: string,
  model?: string,
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const encrypted = encrypt(apiKey)

  await prisma.aiApiKey.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    create: {
      userId: session.user.id,
      provider,
      apiKey: encrypted,
      baseUrl,
      model,
    },
    update: {
      apiKey: encrypted,
      baseUrl,
      model,
    },
  })

  return { success: true }
}

export async function deleteSavedApiKey(provider: Provider) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.aiApiKey.deleteMany({
    where: { userId: session.user.id, provider },
  })

  return { success: true }
}

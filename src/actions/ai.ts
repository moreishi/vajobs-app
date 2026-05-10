'use server'

import { auth } from '@/lib/auth'
import { generateJobData } from '@/lib/ai/providers'
import type { AiProviderId, GeneratedJobData } from '@/lib/ai/providers'

export async function generateJobDescription(data: {
  provider: AiProviderId
  model: string
  apiKey: string
  prompt: string
  baseUrl?: string
}): Promise<{ success: true; data: GeneratedJobData } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can generate job descriptions' }
  }

  if (!data.apiKey?.trim()) return { error: 'API key is required' }
  if (!data.prompt?.trim()) return { error: 'Prompt is required' }
  if (!data.model?.trim()) return { error: 'Model is required' }
  if (data.provider === 'custom' && !data.baseUrl?.trim()) {
    return { error: 'Custom provider requires a base URL' }
  }

  try {
    const result = await generateJobData(
      data.provider,
      data.apiKey.trim(),
      data.model.trim(),
      data.prompt.trim(),
      data.provider === 'custom' ? data.baseUrl?.trim() : undefined,
    )
    return { success: true, data: result }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}

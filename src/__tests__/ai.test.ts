import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { auth } from '@/lib/auth'

const mockClient = { user: { id: 'client-1', role: 'client' } }
const mockAdmin = { user: { id: 'admin-1', role: 'admin' } }
const mockTalent = { user: { id: 'talent-1', role: 'talent' } }

const validParams = {
  provider: 'openai' as const,
  model: 'gpt-4o',
  apiKey: 'sk-test',
  prompt: 'Senior React developer, remote',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateJobDescription', () => {
  it('returns error when not authenticated', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await generateJobDescription(validParams)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not a client or admin', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    const result = await generateJobDescription(validParams)
    expect(result).toEqual({ error: 'Only clients can generate job descriptions' })
  })

  it('allows admin to generate', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockAdmin as any)
    const result = await generateJobDescription(validParams)
    // Should pass auth and fail at fetch (no network in test)
    expect(result).not.toEqual({ error: 'Not authenticated' })
    expect(result).not.toEqual({ error: 'Only clients can generate job descriptions' })
  })

  it('returns error when apiKey is missing', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await generateJobDescription({ ...validParams, apiKey: '' })
    expect(result).toEqual({ error: 'API key is required' })
  })

  it('returns error when prompt is missing', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await generateJobDescription({ ...validParams, prompt: '' })
    expect(result).toEqual({ error: 'Prompt is required' })
  })

  it('returns error when model is missing', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await generateJobDescription({ ...validParams, model: '' })
    expect(result).toEqual({ error: 'Model is required' })
  })

  it('returns error when custom provider has no baseUrl', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await generateJobDescription({ ...validParams, provider: 'custom', baseUrl: '' })
    expect(result).toEqual({ error: 'Custom provider requires a base URL' })
  })

  it('returns error when AI provider call fails', async () => {
    const { generateJobDescription } = await import('@/actions/ai')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await generateJobDescription(validParams)
    // fetch will fail in test environment
    expect(result.error).toBeTruthy()
  })
})

describe('providers', () => {
  it('openai buildRequest produces correct shape', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const req = PROVIDERS.openai.buildRequest('sk-test', 'gpt-4o', 'Senior React dev')
    expect(req.url).toBe('https://api.openai.com/v1/chat/completions')
    expect(req.headers.Authorization).toBe('Bearer sk-test')
    expect((req.body as any).model).toBe('gpt-4o')
    expect((req.body as any).response_format).toEqual({ type: 'json_object' })
  })

  it('anthropic buildRequest produces correct shape', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const req = PROVIDERS.anthropic.buildRequest('sk-ant-test', 'claude-sonnet-4-20250514', 'Senior React dev')
    expect(req.url).toBe('https://api.anthropic.com/v1/messages')
    expect(req.headers['x-api-key']).toBe('sk-ant-test')
    expect(req.headers['anthropic-version']).toBe('2023-06-01')
    expect((req.body as any).model).toBe('claude-sonnet-4-20250514')
    expect((req.body as any).system).toBeTruthy()
  })

  it('deepseek buildRequest produces correct shape', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const req = PROVIDERS.deepseek.buildRequest('sk-test', 'deepseek-chat', 'Senior React dev')
    expect(req.url).toBe('https://api.deepseek.com/v1/chat/completions')
    expect(req.headers.Authorization).toBe('Bearer sk-test')
    expect((req.body as any).model).toBe('deepseek-chat')
    expect((req.body as any).response_format).toEqual({ type: 'json_object' })
  })

  it('custom buildRequest uses provided baseUrl', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const req = PROVIDERS.custom.buildRequest('sk-test', 'my-model', 'Senior React dev', 'https://my-api.example.com/v1')
    expect(req.url).toBe('https://my-api.example.com/v1/chat/completions')
    expect(req.headers.Authorization).toBe('Bearer sk-test')
    expect((req.body as any).model).toBe('my-model')
    expect((req.body as any).response_format).toBeUndefined()
  })

  it('openai parseResponse extracts content', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const text = PROVIDERS.openai.parseResponse({
      choices: [{ message: { content: '{"title":"Test"}' } }],
    } as any)
    expect(text).toBe('{"title":"Test"}')
  })

  it('anthropic parseResponse extracts content', async () => {
    const { PROVIDERS } = await import('@/lib/ai/providers')
    const text = PROVIDERS.anthropic.parseResponse({
      content: [{ text: '{"title":"Test"}' }],
    } as any)
    expect(text).toBe('{"title":"Test"}')
  })

  it('generateJobData parses valid response', async () => {
    const { generateJobData } = await import('@/lib/ai/providers')
    const mockData = {
      title: 'Senior React Developer',
      description: 'We are looking for a senior React developer...',
      shortDescription: 'Senior React dev for a remote SaaS company',
      skills: ['React', 'TypeScript', 'Next.js'],
      salaryRange: '$120k - $150k',
    }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify(mockData) } }],
      }),
    } as any)

    const result = await generateJobData('openai', 'sk-test', 'gpt-4o', 'Senior React dev')
    expect(result.title).toBe('Senior React Developer')
    expect(result.skills).toEqual(['React', 'TypeScript', 'Next.js'])
  })

  it('generateJobData throws on missing fields', async () => {
    const { generateJobData } = await import('@/lib/ai/providers')
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ title: 'Only Title' }) } }],
      }),
    } as any)

    await expect(generateJobData('openai', 'sk-test', 'gpt-4o', 'test'))
      .rejects.toThrow('missing required fields')
  })

  it('generateJobData throws on API error', async () => {
    const { generateJobData } = await import('@/lib/ai/providers')
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    } as any)

    await expect(generateJobData('openai', 'sk-bad', 'gpt-4o', 'test'))
      .rejects.toThrow('OpenAI API error: Invalid API key')
  })
})

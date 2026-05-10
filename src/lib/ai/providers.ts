export type AiProviderId = 'openai' | 'anthropic' | 'deepseek' | 'custom'

export type GeneratedJobData = {
  title: string
  description: string
  shortDescription: string
  skills: string[]
  salaryRange: string
}

type ProviderConfig = {
  label: string
  defaultModel: string
  models: string[]
  buildRequest: (apiKey: string, model: string, prompt: string, baseUrl?: string) => {
    url: string
    headers: Record<string, string>
    body: unknown
  }
  parseResponse: (json: Record<string, unknown>) => string
}

const REQUIRED_FIELDS = ['title', 'description', 'shortDescription', 'skills', 'salaryRange'] as const

export const PROVIDERS: Record<AiProviderId, ProviderConfig> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    buildRequest(apiKey, model, prompt) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2048,
        },
      }
    },
    parseResponse(json) {
      const choice = (json.choices as Record<string, unknown>[])?.[0]
      return (choice?.message as Record<string, unknown>)?.content as string ?? ''
    },
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    buildRequest(apiKey, model, prompt) {
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: {
          model,
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Respond with ONLY valid JSON, no markdown formatting, no code fences. The JSON must have these exact fields: title (string), description (string), shortDescription (string), skills (array of strings), salaryRange (string).\n\n---\n\n${prompt}`,
            },
          ],
        },
      }
    },
    parseResponse(json) {
      const content = (json.content as Record<string, unknown>[])?.[0]
      return content?.text as string ?? ''
    },
  },
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    buildRequest(apiKey, model, prompt) {
      return {
        url: 'https://api.deepseek.com/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2048,
        },
      }
    },
    parseResponse(json) {
      const choice = (json.choices as Record<string, unknown>[])?.[0]
      return (choice?.message as Record<string, unknown>)?.content as string ?? ''
    },
  },
  custom: {
    label: 'Custom OpenAI Compatible',
    defaultModel: '',
    models: [],
    buildRequest(apiKey, model, prompt, baseUrl) {
      const url = baseUrl?.replace(/\/$/, '') + '/chat/completions'
      return {
        url,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: model || 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2048,
        },
      }
    },
    parseResponse(json) {
      const choice = (json.choices as Record<string, unknown>[])?.[0]
      return (choice?.message as Record<string, unknown>)?.content as string ?? ''
    },
  },
}

export async function callAI(
  providerId: AiProviderId,
  apiKey: string,
  model: string,
  system: string,
  userMessage: string,
  baseUrl?: string,
): Promise<string> {
  const provider = PROVIDERS[providerId]
  if (!provider) throw new Error(`Unknown provider: ${providerId}`)

  const { url, headers } = provider.buildRequest(apiKey, model, '', baseUrl)

  let body: Record<string, unknown>
  if (providerId === 'anthropic') {
    body = {
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }
  } else {
    body = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Failed to connect to the AI provider. Check your network connection.')
    }
    throw err
  }

  let responseJson: Record<string, unknown>
  try {
    responseJson = await response.json()
  } catch {
    const text = await response.text().catch(() => '')
    throw new Error(`AI provider returned non-JSON response: ${text.slice(0, 200)}`)
  }

  if (!response.ok) {
    const errorDetail = (responseJson as any)?.error?.message
      ?? (responseJson as any)?.error
      ?? `HTTP ${response.status}`
    throw new Error(`${provider.label} API error: ${errorDetail}`)
  }

  return provider.parseResponse(responseJson)
}

const SYSTEM_PROMPT = `You are a job description generator. Always respond with valid JSON only.

Generate a structured job description with these exact fields:
- title: string (job title)
- description: string (2-4 paragraphs detailing responsibilities, requirements, and benefits)
- shortDescription: string (one sentence, max 150 characters)
- skills: string[] (array of required skills)
- salaryRange: string (salary range or "Negotiable")

Return ONLY valid JSON. No markdown, no code fences.`

export async function generateJobData(
  providerId: AiProviderId,
  apiKey: string,
  model: string,
  prompt: string,
  baseUrl?: string,
): Promise<GeneratedJobData> {
  const provider = PROVIDERS[providerId]
  if (!provider) throw new Error(`Unknown provider: ${providerId}`)

  const { url, headers, body } = provider.buildRequest(apiKey, model, prompt, baseUrl)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Failed to connect to the AI provider. Check your network connection.')
    }
    throw err
  }

  let responseJson: Record<string, unknown>
  try {
    responseJson = await response.json()
  } catch {
    const text = await response.text().catch(() => '')
    throw new Error(`AI provider returned non-JSON response: ${text.slice(0, 200)}`)
  }

  if (!response.ok) {
    const errorDetail = (responseJson as any)?.error?.message
      ?? (responseJson as any)?.error
      ?? `HTTP ${response.status}`
    throw new Error(`${provider.label} API error: ${errorDetail}`)
  }

  const rawText = provider.parseResponse(responseJson)
  if (!rawText) throw new Error('AI returned an empty response')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error(`AI returned invalid JSON. Raw response: ${rawText.slice(0, 200)}`)
  }

  const missing = REQUIRED_FIELDS.filter((f) => {
    const val = parsed[f]
    return val === undefined || val === null || val === ''
  })
  if (missing.length > 0) {
    throw new Error(`AI response missing required fields: ${missing.join(', ')}`)
  }

  return {
    title: String(parsed.title ?? ''),
    description: String(parsed.description ?? ''),
    shortDescription: String(parsed.shortDescription ?? ''),
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
    salaryRange: String(parsed.salaryRange ?? ''),
  }
}

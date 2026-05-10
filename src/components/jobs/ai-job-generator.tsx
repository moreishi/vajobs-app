'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateJobDescription } from '@/actions/ai'
import { PROVIDERS } from '@/lib/ai/providers'
import { toast } from 'sonner'
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from 'lucide-react'
import type { AiProviderId, GeneratedJobData } from '@/lib/ai/providers'

type AiJobGeneratorProps = {
  onApply: (field: string, value: string) => void
}

export function AiJobGenerator({ onApply }: AiJobGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState<AiProviderId>('openai')
  const [model, setModel] = useState(PROVIDERS.openai.defaultModel)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedJobData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const config = PROVIDERS[provider]

  function handleProviderChange(value: string) {
    const id = value as AiProviderId
    setProvider(id)
    setModel(PROVIDERS[id].defaultModel)
    setResult(null)
    setError(null)
  }

  async function handleGenerate() {
    if (!apiKey.trim()) { setError('API key is required'); return }
    if (!prompt.trim()) { setError('Prompt is required'); return }
    if (provider === 'custom' && !baseUrl.trim()) { setError('Base URL is required'); return }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    const res = await generateJobDescription({
      provider,
      model: model || config.defaultModel,
      apiKey: apiKey.trim(),
      prompt: prompt.trim(),
      ...(provider === 'custom' ? { baseUrl: baseUrl.trim() } : {}),
    })

    setIsGenerating(false)

    if ('error' in res) {
      setError(res.error)
    } else {
      setResult(res.data)
      toast.success('Job description generated')
    }
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">AI Job Description Generator</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Provider */}
          <div>
            <Label className="text-xs">Provider</Label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
              <option value="custom">Custom OpenAI Compatible</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <Label className="text-xs">Model</Label>
            {provider === 'custom' ? (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gpt-4o"
                className="mt-1 h-8 text-sm"
              />
            ) : (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {config.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          {/* API Key */}
          <div>
            <Label className="text-xs">API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="mt-1 h-8 text-sm"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your key is sent directly to the provider. Not stored.
            </p>
          </div>

          {/* Base URL (custom only) */}
          {provider === 'custom' && (
            <div>
              <Label className="text-xs">Base URL</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-endpoint.com/v1"
                className="mt-1 h-8 text-sm"
              />
            </div>
          )}

          {/* Prompt */}
          <div>
            <Label className="text-xs">Describe the role</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Senior frontend developer, React, TypeScript, remote, $120k-$150k..."
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          {/* Generate button */}
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">Generated Content</p>

              <ResultField
                label="Job Title"
                value={result.title}
                onApply={() => onApply('title', result.title)}
              />
              <ResultField
                label="Description"
                value={result.description}
                onApply={() => onApply('description', result.description)}
              />
              <ResultField
                label="Short Description"
                value={result.shortDescription}
                onApply={() => onApply('shortDescription', result.shortDescription)}
              />
              <ResultField
                label="Skills"
                value={result.skills.join(', ')}
                onApply={() => onApply('skills', result.skills.join(', '))}
              />
              <ResultField
                label="Salary Range"
                value={result.salaryRange}
                onApply={() => onApply('salaryRange', result.salaryRange)}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ResultField({
  label,
  value,
  onApply,
}: {
  label: string
  value: string
  onApply: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{label}</span>
        <Button type="button" variant="outline" size="xs" onClick={onApply}>
          Apply
        </Button>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
        {value || <span className="italic">(empty)</span>}
      </p>
    </div>
  )
}

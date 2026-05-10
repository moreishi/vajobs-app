'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { findMatchingTalents, enrichMatchingWithAI } from '@/actions/talent-matching'
import { PROVIDERS } from '@/lib/ai/providers'
import { toast } from 'sonner'
import { ChevronDownIcon, ChevronUpIcon, UsersIcon, SparklesIcon, ExternalLinkIcon } from 'lucide-react'
import type { TalentMatchResult } from '@/actions/talent-matching'
import type { AiProviderId } from '@/lib/ai/providers'

export function TalentMatchingPanel({ jobPostId }: { jobPostId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<TalentMatchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  // AI enrichment state
  const [aiProvider, setAiProvider] = useState<AiProviderId>('openai')
  const [aiModel, setAiModel] = useState(PROVIDERS.openai.defaultModel)
  const [aiKey, setAiKey] = useState('')
  const [aiBaseUrl, setAiBaseUrl] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  async function handleFind() {
    setLoading(true)
    setResults(null)
    const res = await findMatchingTalents(jobPostId)
    setLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      setResults(res.data)
      if (res.data.length === 0) toast.error('No matching talents found')
    }
  }

  async function handleEnrich() {
    if (!aiKey.trim()) { toast.error('API key is required'); return }
    if (aiProvider === 'custom' && !aiBaseUrl.trim()) { toast.error('Base URL is required'); return }

    setAiLoading(true)
    const res = await enrichMatchingWithAI({
      jobPostId,
      provider: aiProvider,
      apiKey: aiKey.trim(),
      model: aiModel,
      ...(aiProvider === 'custom' ? { baseUrl: aiBaseUrl.trim() } : {}),
    })
    setAiLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      setResults(res.data)
      toast.success('AI enrichment complete')
    }
  }

  const aiConfig = PROVIDERS[aiProvider]

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Talent Matching</CardTitle>
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
          <p className="text-xs text-muted-foreground">
            Find talents whose skills match this job posting.
          </p>

          <Button type="button" size="sm" onClick={handleFind} disabled={loading}>
            {loading ? 'Searching...' : 'Find Matching Talents'}
          </Button>

          {results !== null && results.length === 0 && (
            <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
              No talents found with matching skills. Add more skills to your job posting.
            </div>
          )}

          {results !== null && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {results.length} talent{results.length !== 1 ? 's' : ''} found
              </p>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {results.map((talent, i) => (
                  <TalentMatchCard key={talent.profileId} talent={talent} rank={i + 1} />
                ))}
              </div>

              {/* AI Enrichment */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">AI Enrichment (optional)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Provider</Label>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        const id = e.target.value as AiProviderId
                        setAiProvider(id)
                        setAiModel(PROVIDERS[id].defaultModel)
                      }}
                      className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Model</Label>
                    {aiProvider === 'custom' ? (
                      <Input
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="model name"
                        className="mt-1 h-8 text-sm"
                      />
                    ) : (
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        {aiConfig.models.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">API Key</Label>
                    <Input
                      type="password"
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder="sk-..."
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  {aiProvider === 'custom' && (
                    <div className="flex-1">
                      <Label className="text-xs">Base URL</Label>
                      <Input
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleEnrich}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Enriching...' : 'Enrich with AI'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function TalentMatchCard({ talent, rank }: { talent: TalentMatchResult; rank: number }) {
  const scoreColor =
    talent.matchScore >= 70 ? 'bg-green-500' :
    talent.matchScore >= 40 ? 'bg-yellow-500' :
    'bg-muted-foreground'

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">#{rank}</span>
            <span className="truncate font-medium">
              {talent.name || talent.email}
            </span>
            {talent.verified && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Verified
              </span>
            )}
          </div>
          {talent.headline && (
            <p className="truncate text-xs text-muted-foreground">{talent.headline}</p>
          )}
        </div>
        <Link
          href={`/talents/${talent.userId}`}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Profile <ExternalLinkIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Match score bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${scoreColor}`}
            style={{ width: `${talent.matchScore}%` }}
          />
        </div>
        <span className="text-xs font-medium">{talent.matchScore}%</span>
      </div>

      {/* Matched skills */}
      {talent.matchedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {talent.matchedSkills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
            >
              {skill}
            </span>
          ))}
          {talent.matchedSkills.length > 6 && (
            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              +{talent.matchedSkills.length - 6}
            </span>
          )}
        </div>
      )}

      {/* AI Reason */}
      {talent.aiReason && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {talent.aiReason}
        </p>
      )}
    </div>
  )
}

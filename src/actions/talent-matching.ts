'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai/providers'
import type { AiProviderId } from '@/lib/ai/providers'

export type TalentMatchResult = {
  profileId: string
  userId: string
  name: string | null
  email: string
  headline: string | null
  bio: string | null
  skills: string[]
  experience: number | null
  hourlyRate: number | null
  verified: boolean
  matchScore: number
  matchedSkills: string[]
  aiReason?: string
}

export async function findMatchingTalents(
  jobPostId: string,
): Promise<{ success: true; data: TalentMatchResult[] } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can find matching talents' }
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { id: true, skills: true, posterId: true },
  })
  if (!job) return { error: 'Job not found' }
  if (job.posterId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  const jobSkills: string[] = JSON.parse(job.skills || '[]')
  if (jobSkills.length === 0) return { success: true, data: [] }

  const profiles = await prisma.profile.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      skills: true,
      experience: true,
      hourlyRate: true,
      verified: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const results: TalentMatchResult[] = []

  for (const profile of profiles) {
    const profileSkills: string[] = JSON.parse(profile.skills || '[]')
    const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase().trim())
    const normalizedProfileSkills = profileSkills.map((s) => s.toLowerCase().trim())

    const matchedSkills = normalizedJobSkills.filter((js) =>
      normalizedProfileSkills.some((ps) => ps.includes(js) || js.includes(ps)),
    )

    const score = matchedSkills.length > 0
      ? matchedSkills.length / Math.max(jobSkills.length, profileSkills.length)
      : 0

    if (score > 0) {
      results.push({
        profileId: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        email: profile.user.email,
        headline: profile.headline,
        bio: profile.bio,
        skills: profileSkills,
        experience: profile.experience,
        hourlyRate: profile.hourlyRate,
        verified: profile.verified,
        matchScore: Math.round(score * 100),
        matchedSkills: profileSkills.filter((s) =>
          normalizedJobSkills.some((js) =>
            js.includes(s.toLowerCase().trim()) || s.toLowerCase().trim().includes(js),
          ),
        ),
      })
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore)
  return { success: true, data: results }
}

export async function enrichMatchingWithAI(data: {
  jobPostId: string
  provider: AiProviderId
  apiKey: string
  model: string
  baseUrl?: string
}): Promise<{ success: true; data: TalentMatchResult[] } | { error: string }> {
  const authResult = await findMatchingTalents(data.jobPostId)
  if ('error' in authResult) return authResult

  const matches = authResult.data
  if (matches.length === 0) return { success: true, data: [] }

  if (!data.apiKey?.trim()) return { error: 'API key is required' }
  if (!data.model?.trim()) return { error: 'Model is required' }
  if (data.provider === 'custom' && !data.baseUrl?.trim()) {
    return { error: 'Custom provider requires a base URL' }
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: data.jobPostId },
    select: { title: true, description: true, skills: true },
  })
  if (!job) return { error: 'Job not found' }

  const jobSkills: string[] = JSON.parse(job.skills || '[]')
  const topCandidates = matches.slice(0, 15)

  const candidatesText = topCandidates
    .map(
      (c, i) =>
        `${i + 1}. Name: ${c.name || 'Unknown'}\n   Headline: ${c.headline || 'N/A'}\n   Skills: ${c.skills.join(', ')}\n   Experience: ${c.experience ?? 'N/A'} years\n   Bio: ${c.bio?.slice(0, 300) || 'N/A'}`,
    )
    .join('\n\n')

  const userPrompt = `Job Title: ${job.title || 'N/A'}
Description: ${job.description?.slice(0, 1000) || 'N/A'}
Required Skills: ${jobSkills.join(', ')}

Candidates:
${candidatesText}

Respond with ONLY valid JSON, no markdown. Format:
{
  "matches": [
    {"candidateIndex": 0, "rank": 1, "reason": "2-3 sentence explanation of why this candidate fits"},
    ...
  ]
}
Rank all ${topCandidates.length} candidates. candidateIndex is 0-based. Higher rank = better match.`

  try {
    const raw = await callAI(
      data.provider,
      data.apiKey.trim(),
      data.model.trim(),
      'You are a talent matching expert. Analyze job requirements and candidate profiles to rank the best matches. Return only valid JSON.',
      userPrompt,
      data.provider === 'custom' ? data.baseUrl?.trim() : undefined,
    )

    const parsed = JSON.parse(raw)
    const aiMatches: { candidateIndex: number; rank: number; reason: string }[] = parsed.matches ?? []

    const enrichedMap = new Map<string, TalentMatchResult>()
    for (const match of topCandidates) {
      enrichedMap.set(match.profileId, match)
    }

    const enriched: TalentMatchResult[] = []
    const seen = new Set<string>()

    for (const ai of aiMatches.sort((a, b) => a.rank - b.rank)) {
      const original = topCandidates[ai.candidateIndex]
      if (original && !seen.has(original.profileId)) {
        seen.add(original.profileId)
        enriched.push({ ...original, aiReason: ai.reason })
      }
    }

    for (const m of topCandidates) {
      if (!seen.has(m.profileId)) {
        enriched.push(m)
      }
    }

    const remaining = matches.slice(15)
    enriched.push(...remaining)

    return { success: true, data: enriched }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'AI enrichment failed' }
  }
}

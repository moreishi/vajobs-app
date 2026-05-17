import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://vajobs.online'

const staticPages = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/jobs', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/talents', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/hello-startup', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/hello-va', priority: 0.6, changeFrequency: 'monthly' as const },
]

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobUrls: MetadataRoute.Sitemap = []
  let talentUrls: MetadataRoute.Sitemap = []

  try {
    const [openJobs, publicTalents] = await Promise.all([
      prisma.jobPost.findMany({
        where: { status: 'open' },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.profile.findMany({
        where: { isPublic: true },
        select: { userId: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    jobUrls = openJobs.map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    talentUrls = publicTalents.map((profile) => ({
      url: `${BASE_URL}/talents/${profile.userId}`,
      lastModified: profile.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // DB not available — return static pages only
  }

  return [
    ...staticPages.map((page) => ({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...jobUrls,
    ...talentUrls,
  ]
}

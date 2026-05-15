import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://vajobs.online'

const staticPages = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/jobs', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/talents', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/hello-startup', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/hello-va', priority: 0.6, changeFrequency: 'monthly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}

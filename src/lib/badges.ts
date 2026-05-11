import type { Badge, BadgeType, Profile } from '@/types'

export const BADGE_CONFIGS: Record<BadgeType, { label: string; description: string }> = {
  verified: { label: 'Verified', description: 'Identity verified' },
  expert: { label: 'Expert', description: '5+ years experience' },
  'rising-talent': { label: 'Rising Talent', description: 'Complete profile with strong presence' },
  'top-rated': { label: 'Top Rated', description: '4.5+ star average rating' },
  'fast-responder': { label: 'Fast Responder', description: 'Responds within 1 hour' },
  premium: { label: 'Premium VA', description: 'Premium subscription active' },
}

export interface BadgeOptions {
  rating?: { average: number; count: number }
  hasPremium?: boolean
}

export function computeBadges(profile: Pick<Profile, 'verified' | 'experience' | 'headline' | 'bio' | 'skills' | 'hourlyRate'>, options?: BadgeOptions): Badge[] {
  const badges: Badge[] = []

  if (profile.verified) {
    badges.push({ type: 'verified', ...BADGE_CONFIGS.verified })
  }

  if (profile.experience && profile.experience >= 5) {
    badges.push({ type: 'expert', ...BADGE_CONFIGS.expert })
  }

  if (profile.headline && profile.bio && profile.skills.length > 0 && profile.hourlyRate) {
    badges.push({ type: 'rising-talent', ...BADGE_CONFIGS['rising-talent'] })
  }

  if (options?.rating && options.rating.average >= 4.5 && options.rating.count >= 1) {
    badges.push({ type: 'top-rated', ...BADGE_CONFIGS['top-rated'] })
  }

  if (options?.hasPremium) {
    badges.push({ type: 'premium', ...BADGE_CONFIGS.premium })
  }

  return badges
}

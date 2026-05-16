'use client'

import { getTier } from '@/lib/reputation'
import type { Tier } from '@/lib/reputation'

const TIER_COLORS: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  Bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-amber-500/30',
    icon: '🥉',
  },
  Silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-400/30',
    icon: '🥈',
  },
  Gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    ring: 'ring-yellow-500/30',
    icon: '🥇',
  },
  Platinum: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    ring: 'ring-indigo-500/30',
    icon: '💎',
  },
}

type Props = {
  xp: number
  tier?: Tier
  showXp?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ReputationBadge({ xp, tier: tierProp, showXp = true, size = 'sm' }: Props) {
  const tier = tierProp ?? getTier(xp)
  const colors = TIER_COLORS[tier.name] ?? TIER_COLORS.Bronze
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring} ${sizeClasses}`}
    >
      <span className="text-[1em] leading-none">{colors.icon}</span>
      <span>{tier.label}</span>
      {showXp && <span className="opacity-70">({xp} XP)</span>}
    </span>
  )
}

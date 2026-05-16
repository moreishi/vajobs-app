'use client'

import { getTier } from '@/actions/reputation'

type Props = {
  xp: number
}

export function ReputationProgress({ xp }: Props) {
  const tier = getTier(xp)

  if (tier.maxXp === Infinity) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{tier.label}</span>
          <span>{xp.toLocaleString()} XP — Max tier</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      </div>
    )
  }

  const progress = xp === 0 ? 0 : Math.round(((xp - tier.minXp) / (tier.maxXp - tier.minXp)) * 100)
  const nextTier = getTier(tier.maxXp + 1)
  const remaining = tier.maxXp - xp + 1

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{tier.label}</span>
        <span>{xp.toLocaleString()} / {tier.maxXp.toLocaleString()} XP</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {remaining.toLocaleString()} XP to {nextTier.label}
      </p>
    </div>
  )
}

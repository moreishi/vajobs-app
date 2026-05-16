export interface Tier {
  name: string
  label: string
  minXp: number
  maxXp: number
}

const TIERS: Tier[] = [
  { name: 'Bronze', label: 'Bronze', minXp: 0, maxXp: 499 },
  { name: 'Silver', label: 'Silver', minXp: 500, maxXp: 1999 },
  { name: 'Gold', label: 'Gold', minXp: 2000, maxXp: 4999 },
  { name: 'Platinum', label: 'Platinum', minXp: 5000, maxXp: Infinity },
]

export function getTier(xp: number): Tier {
  return TIERS.find((t) => xp >= t.minXp && xp <= t.maxXp) ?? TIERS[0]
}

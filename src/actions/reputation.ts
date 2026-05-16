'use server'

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/actions/notifications'
import { getTier } from '@/lib/reputation'
import type { Tier } from '@/lib/reputation'

export async function awardXp({
  userId,
  amount,
  reason,
  referenceId,
}: {
  userId: string
  amount: number
  reason: string
  referenceId?: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true },
  })
  if (!user) {
    return { xpAwarded: 0, totalXp: 0, oldTier: null, newTier: null, didLevelUp: false }
  }

  const oldTier = getTier(user.xp)

  await prisma.xpTransaction.create({
    data: { userId, amount, reason, referenceId },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  })

  const totalXp = user.xp + amount
  const newTier = getTier(totalXp)
  const didLevelUp = newTier.name !== oldTier.name

  if (didLevelUp) {
    await createNotification({
      userId,
      type: 'xp_level_up',
      title: `${newTier.label} Tier Unlocked!`,
      body: `Congratulations! You've reached the ${newTier.label} tier with ${totalXp} XP.`,
    })
  }

  return { xpAwarded: amount, totalXp, oldTier, newTier, didLevelUp }
}

export async function getReputation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      _count: { select: { xpTransactions: true } },
    },
  })
  if (!user) return null

  const tier = getTier(user.xp)
  const progress = tier.maxXp === Infinity
    ? { current: user.xp, min: tier.minXp, max: tier.minXp, percentage: 100 }
    : {
        current: user.xp,
        min: tier.minXp,
        max: tier.maxXp,
        percentage: user.xp === 0 ? 0 : Math.round(((user.xp - tier.minXp) / (tier.maxXp - tier.minXp)) * 100),
      }

  return {
    xp: user.xp,
    totalTransactions: user._count.xpTransactions,
    tier,
    progress,
  }
}

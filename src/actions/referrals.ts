'use server'

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/actions/notifications'

const REFERRAL_REWARD_AMOUNT = 10

export async function grantReferralReward(
  refereeId: string,
  referrerId: string,
  _refereeRole: string,
  triggerLabel: string,
) {
  const existing = await prisma.referralReward.findUnique({
    where: { referrerId_refereeId: { referrerId, refereeId } },
  })
  if (existing) return

  await prisma.$transaction([
    prisma.referralReward.create({
      data: {
        referrerId,
        refereeId,
        amount: REFERRAL_REWARD_AMOUNT,
      },
    }),
    prisma.user.update({
      where: { id: refereeId },
      data: { connects: { increment: REFERRAL_REWARD_AMOUNT } },
    }),
    prisma.user.update({
      where: { id: referrerId },
      data: { connects: { increment: REFERRAL_REWARD_AMOUNT } },
    }),
    prisma.connectTransaction.create({
      data: {
        userId: refereeId,
        amount: REFERRAL_REWARD_AMOUNT,
        type: 'referral',
        description: `Referral bonus for ${triggerLabel}`,
      },
    }),
    prisma.connectTransaction.create({
      data: {
        userId: referrerId,
        amount: REFERRAL_REWARD_AMOUNT,
        type: 'referral',
        description: `Referral bonus — someone you referred earned it by ${triggerLabel}`,
      },
    }),
  ])

  await createNotification({
    userId: refereeId,
    type: 'referral_reward',
    title: 'Referral Bonus Earned!',
    body: `You earned ${REFERRAL_REWARD_AMOUNT} connects for ${triggerLabel}.`,
    link: '/dashboard/connects',
  })

  await createNotification({
    userId: referrerId,
    type: 'referral_reward',
    title: 'Referral Bonus Earned!',
    body: `Someone you referred earned you ${REFERRAL_REWARD_AMOUNT} connects by ${triggerLabel}.`,
    link: '/dashboard/connects',
  })
}

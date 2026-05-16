'use server'

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/actions/notifications'
import { auth } from '@/lib/auth'
import { sendEmail, buildEmailHtml } from '@/lib/email'

const REFERRAL_REWARD_AMOUNT = 10

export async function ensureReferralCode(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true },
  })
  if (user?.referralCode) return user.referralCode

  const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  await prisma.user.update({
    where: { id: session.user.id },
    data: { referralCode: code },
  })
  return code
}

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

export async function sendReferralInvite(
  email: string,
  baseUrl: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  if (!email || !email.trim()) return { error: 'Email is required' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true, name: true },
  })
  if (!user) return { error: 'Not authenticated' }
  if (!user.referralCode) return { error: 'No referral code found' }

  const registerUrl = `${baseUrl}/register?ref=${user.referralCode}`
  const referrerName = user.name || 'Someone'

  try {
    await sendEmail({
      to: email.trim(),
      subject: `${referrerName} invited you to join VA Jobs Online!`,
      html: buildEmailHtml(
        `${referrerName} thinks you'd be a great fit for VA Jobs Online — the platform connecting Filipino talent with top international clients. ` +
        `Sign up using their referral link to earn 10 free connects when you complete your first action!`,
        { text: 'Accept Invite', url: registerUrl },
      ),
    })
    return { success: true }
  } catch {
    return { error: 'Failed to send invite' }
  }
}

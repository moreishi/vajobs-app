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
  amount = REFERRAL_REWARD_AMOUNT,
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
        amount,
      },
    }),
    prisma.user.update({
      where: { id: refereeId },
      data: { connects: { increment: amount } },
    }),
    prisma.user.update({
      where: { id: referrerId },
      data: { connects: { increment: amount } },
    }),
    prisma.connectTransaction.create({
      data: {
        userId: refereeId,
        amount,
        type: 'referral',
        description: `Referral bonus for ${triggerLabel}`,
      },
    }),
    prisma.connectTransaction.create({
      data: {
        userId: referrerId,
        amount,
        type: 'referral',
        description: `Referral bonus — someone you referred earned it by ${triggerLabel}`,
      },
    }),
  ])

  await createNotification({
    userId: refereeId,
    type: 'referral_reward',
    title: 'Referral Bonus Earned!',
    body: `You earned ${amount} connects for ${triggerLabel}.`,
    link: '/dashboard/connects',
  })

  await createNotification({
    userId: referrerId,
    type: 'referral_reward',
    title: 'Referral Bonus Earned!',
    body: `Someone you referred earned you ${amount} connects by ${triggerLabel}.`,
    link: '/dashboard/connects',
  })

  await checkAndGrantMilestoneBonuses(referrerId)
}

const MILESTONE_DEFINITIONS = [
  { threshold: 3, bonus: 20, label: '3 referrals' },
  { threshold: 5, bonus: 50, label: '5 referrals' },
  { threshold: 10, bonus: 100, label: '10 referrals' },
]

export async function checkAndGrantMilestoneBonuses(referrerId: string) {
  const totalRewards = await prisma.referralReward.count({
    where: { referrerId },
  })

  const claimed = await prisma.referralMilestone.findMany({
    where: { referrerId },
    select: { milestone: true },
  })
  const claimedSet = new Set(claimed.map((c) => c.milestone))

  const reached = MILESTONE_DEFINITIONS.filter(
    (m) => totalRewards >= m.threshold && !claimedSet.has(m.threshold),
  )

  if (reached.length === 0) return

  for (const milestone of reached) {
    await prisma.$transaction([
      prisma.referralMilestone.create({
        data: { referrerId, milestone: milestone.threshold, bonus: milestone.bonus },
      }),
      prisma.user.update({
        where: { id: referrerId },
        data: { connects: { increment: milestone.bonus } },
      }),
      prisma.connectTransaction.create({
        data: {
          userId: referrerId,
          amount: milestone.bonus,
          type: 'referral',
          description: `Milestone bonus: reached ${milestone.label}!`,
        },
      }),
    ])

    await createNotification({
      userId: referrerId,
      type: 'referral_reward',
      title: 'Referral Milestone Reached!',
      body: `You reached ${milestone.label} and earned ${milestone.bonus} bonus connects!`,
      link: '/dashboard/referrals',
    })
  }
}

export interface RewardHistoryEntry {
  id: string
  type: 'referral' | 'milestone'
  amount: number
  label: string
  refereeName: string | null
  refereeEmail: string | null
  createdAt: Date
}

export async function getReferralRewardsHistory(referrerId: string): Promise<RewardHistoryEntry[]> {
  const [rewards, milestones] = await Promise.all([
    prisma.referralReward.findMany({
      where: { referrerId },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        referee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralMilestone.findMany({
      where: { referrerId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const entries: RewardHistoryEntry[] = [
    ...rewards.map((r) => ({
      id: r.id,
      type: 'referral' as const,
      amount: r.amount,
      label: `Referral reward`,
      refereeName: r.referee.name,
      refereeEmail: r.referee.email,
      createdAt: r.createdAt,
    })),
    ...milestones.map((m) => ({
      id: m.id,
      type: 'milestone' as const,
      amount: m.bonus,
      label: `${m.milestone} referrals milestone`,
      refereeName: null as string | null,
      refereeEmail: null as string | null,
      createdAt: m.createdAt,
    })),
  ]

  entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return entries
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
    select: { id: true, referralCode: true, name: true, role: true },
  })
  if (!user) return { error: 'Not authenticated' }
  if (!user.referralCode) return { error: 'No referral code found' }

  // Send referred users to the appropriate landing page based on referrer role
  const landingPage = user.role === 'client' ? 'hello-startup' : 'hello-va'
  const registerUrl = `${baseUrl}/${landingPage}?ref=${user.referralCode}`
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

    await prisma.referralInvite.create({
      data: {
        referrerId: user.id,
        email: email.trim(),
        status: 'sent',
      },
    })

    return { success: true }
  } catch {
    return { error: 'Failed to send invite' }
  }
}

export async function getReferralInvites(referrerId: string) {
  const invites = await prisma.referralInvite.findMany({
    where: { referrerId },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      referee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return invites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    status: inv.status,
    createdAt: inv.createdAt,
    refereeName: inv.referee?.name ?? null,
    refereeEmail: inv.referee?.email ?? null,
  }))
}

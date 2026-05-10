'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enqueueEmail } from '@/lib/email/worker'

export type NotificationType =
  | 'application_received'
  | 'status_updated'
  | 'interview_scheduled'
  | 'interview_cancelled'
  | 'message_received'
  | 'review_received'
  | 'engagement_ended'
  | 'connects_purchased'
  | 'payment_completed'
  | 'subscription_cancelled'
  | 'subscription_renewal'
  | 'contract_created'
  | 'contract_signed'
  | 'contract_terminated'
  | 'invoice_received'
  | 'invoice_paid'
  | 'milestone_created'
  | 'milestone_completed'
  | 'milestone_approved'
  | 'milestone_rejected'
  | 'proposal_accepted'
  | 'proposal_updated'

const EMAIL_TEMPLATES: Record<string, string> = {
  application_received: 'A new applicant has applied to your job posting.',
  status_updated: 'The status of your application has been updated.',
  interview_scheduled: 'An interview has been scheduled. Check the details in your dashboard.',
  interview_cancelled: 'A scheduled interview has been cancelled.',
  message_received: 'You have received a new message.',
  review_received: 'Someone has left a review for you.',
  engagement_ended: 'An engagement has ended.',
  connects_purchased: 'Your connects purchase was successful.',
  payment_completed: 'Your payment has been completed successfully.',
  subscription_cancelled: 'Your subscription has been cancelled.',
  subscription_renewal: 'Your subscription has been renewed.',
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}) {
  await prisma.notification.create({
    data: { userId, type, title, body, link },
  })

  // Defer email to background worker — response returns immediately
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  enqueueEmail({
    userId,
    type,
    title,
    body: body || EMAIL_TEMPLATES[type] || title,
    link,
    baseUrl,
  })
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })
}

export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  })
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  revalidatePath('/dashboard')
}

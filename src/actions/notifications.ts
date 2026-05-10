'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, buildEmailHtml } from '@/lib/email'

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

  // Send email asynchronously (doesn't block the response)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })
  if (user?.email && process.env.RESEND_API_KEY) {
    // Check if user has opted out of this notification type
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    })
    if (pref?.email === false) return

    const emailBody = buildEmailBody(type, title, body)
    const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
    const cta = link ? { text: 'View on Talent Hub', url: `${baseUrl}${link}` } : undefined
    const unsubscribeUrl = `${baseUrl}/dashboard/settings/notifications`
    sendEmail({
      to: user.email,
      subject: `[Talent Hub] ${title}`,
      html: buildEmailHtml(emailBody, cta, unsubscribeUrl),
    })
  }
}

function buildEmailBody(type: string, title: string, body?: string): string {
  if (body) return body

  const templates: Record<string, string> = {
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

  return templates[type] || title
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

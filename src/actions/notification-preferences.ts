'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@/actions/notifications'
import { defaultEmailEnabled } from '@/lib/notification-defaults'

const NOTIFICATION_TYPES: { type: NotificationType; label: string; description: string }[] = [
  { type: 'application_received', label: 'Application Received', description: 'When someone applies to your job' },
  { type: 'status_updated', label: 'Application Status Updated', description: 'When your application status changes' },
  { type: 'interview_scheduled', label: 'Interview Scheduled', description: 'When an interview is scheduled' },
  { type: 'interview_cancelled', label: 'Interview Cancelled', description: 'When an interview is cancelled' },
  { type: 'message_received', label: 'New Message', description: 'When you receive a message' },
  { type: 'review_received', label: 'Review Received', description: 'When you receive a review' },
  { type: 'engagement_ended', label: 'Engagement Ended', description: 'When an engagement ends' },
  { type: 'connects_purchased', label: 'Connects Purchased', description: 'When you purchase connects' },
  { type: 'payment_completed', label: 'Payment Completed', description: 'When a payment completes' },
  { type: 'subscription_cancelled', label: 'Subscription Cancelled', description: 'When your subscription is cancelled' },
  { type: 'subscription_renewal', label: 'Subscription Renewal', description: 'When your subscription renews' },
  { type: 'contract_created', label: 'Contract Created', description: 'When a contract is created for your engagement' },
  { type: 'contract_signed', label: 'Contract Signed', description: 'When a contract has been signed' },
  { type: 'contract_terminated', label: 'Contract Terminated', description: 'When a contract is terminated' },
  { type: 'invoice_received', label: 'Invoice Received', description: 'When you receive a new invoice' },
  { type: 'invoice_paid', label: 'Invoice Paid', description: 'When an invoice is marked as paid' },
  { type: 'milestone_created', label: 'Milestone Created', description: 'When a milestone is added to a contract' },
  { type: 'milestone_completed', label: 'Milestone Completed', description: 'When a milestone is marked complete' },
  { type: 'milestone_approved', label: 'Milestone Approved', description: 'When the client approves a milestone' },
  { type: 'milestone_rejected', label: 'Milestone Rejected', description: 'When a milestone needs revisions' },
  { type: 'proposal_accepted', label: 'Proposal Accepted', description: 'When your proposal is accepted' },
]

export type NotificationPreferenceData = {
  type: string
  email: boolean
}

export async function getNotificationPreferences() {
  const session = await auth()
  if (!session?.user?.id) return []

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: session.user.id },
  })

  // Merge defaults — fall back to per-type default (opt-out for high-frequency types)
  return NOTIFICATION_TYPES.map((nt) => {
    const existing = preferences.find((p) => p.type === nt.type)
    return {
      type: nt.type,
      label: nt.label,
      description: nt.description,
      email: existing?.email ?? defaultEmailEnabled(nt.type),
    }
  })
}

export async function updateNotificationPreference(type: string, email: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  // Validate type
  if (!NOTIFICATION_TYPES.find((nt) => nt.type === type)) {
    return { error: 'Invalid notification type' }
  }

  await prisma.notificationPreference.upsert({
    where: {
      userId_type: { userId: session.user.id, type },
    },
    create: {
      userId: session.user.id,
      type,
      email,
    },
    update: {
      email,
    },
  })

  revalidatePath('/dashboard/settings/notifications')
  return { success: true }
}

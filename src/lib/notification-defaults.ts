import type { NotificationType } from '@/actions/notifications'

// High-frequency / low-urgency types default to email: false to prevent spam.
// Transactional types (applications, payments, contracts) default to email: true.
export const DEFAULT_EMAIL_PREFERENCES: Record<NotificationType, boolean> = {
  application_received: true,
  status_updated: false,
  interview_scheduled: true,
  interview_cancelled: true,
  message_received: false,
  review_received: false,
  engagement_ended: false,
  connects_purchased: true,
  payment_completed: true,
  subscription_cancelled: true,
  subscription_renewal: true,
  contract_created: true,
  contract_signed: true,
  contract_terminated: true,
  invoice_received: true,
  invoice_paid: true,
  milestone_created: false,
  milestone_completed: false,
  milestone_approved: true,
  milestone_rejected: false,
  proposal_accepted: true,
  proposal_updated: false,
}

export function defaultEmailEnabled(type: string): boolean {
  return DEFAULT_EMAIL_PREFERENCES[type as NotificationType] ?? true
}

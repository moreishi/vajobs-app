import { prisma } from '@/lib/prisma'
import { sendEmail, buildEmailHtml } from '@/lib/email'
import { logger } from '@/lib/logger'
import { defaultEmailEnabled } from '@/lib/notification-defaults'

type EmailJob = {
  userId: string
  type: string
  title: string
  body: string
  link?: string
  baseUrl: string
}

export async function enqueueEmail(job: EmailJob) {
  if (!process.env.RESEND_API_KEY) return

  await prisma.emailLog.create({
    data: {
      userId: job.userId,
      email: '',
      type: job.type,
      subject: job.title,
      status: 'pending',
    },
  })
}

export async function enqueueTransactionalEmail({
  userId,
  email,
  type,
  subject,
  data,
}: {
  userId: string
  email: string
  type: string
  subject: string
  data: string
}) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Email Worker', `RESEND_API_KEY not set — ${type} not queued`)
    return
  }

  await prisma.emailLog.create({
    data: {
      userId,
      email,
      type,
      subject,
      status: 'pending',
      error: data,
    },
  })
}

export async function processPendingEmails(limit = 20) {
  if (!process.env.RESEND_API_KEY) return { processed: 0, failed: 0 }

  const pending = await prisma.emailLog.findMany({
    where: { status: 'pending' },
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  let processed = 0
  let failed = 0

  for (const log of pending) {
    try {
      await processLogEntry(log)
      processed++
    } catch (err) {
      logger.error('Email Worker', `Failed to process log ${log.id}`, err instanceof Error ? err.stack : err)
      failed++
    }
  }

  return { processed, failed }
}

async function processLogEntry(log: { id: string; userId: string | null; email: string; type: string; subject: string; error: string | null }) {
  // Handle transactional emails (password reset, email verification)
  if (log.type === 'password_reset') {
    await sendTransactionalEmail(log, 'password_reset')
    return
  }

  if (log.type === 'email_verification') {
    await sendTransactionalEmail(log, 'email_verification')
    return
  }

  if (!log.userId) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'failed', error: 'No userId' },
    })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: log.userId },
    select: { email: true },
  })
  if (!user?.email) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'failed', error: 'User has no email' },
    })
    return
  }

  // Check notification preferences
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId: log.userId, type: log.type } },
  })
  const emailEnabled = pref?.email ?? defaultEmailEnabled(log.type)
  if (!emailEnabled) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'skipped', error: 'Email notifications disabled' },
    })
    return
  }

  // Get the notification body for richer email content
  const notification = await prisma.notification.findFirst({
    where: { userId: log.userId, type: log.type },
    orderBy: { createdAt: 'desc' },
    select: { body: true, link: true },
  })

  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const link = notification?.link
  const bodyText = notification?.body || log.subject
  const cta = link ? { text: 'View on VA Jobs Online', url: `${baseUrl}${link}` } : undefined
  const unsubscribeUrl = `${baseUrl}/dashboard/settings/notifications`

  try {
    await sendEmail({
      to: user.email,
      subject: `[VA Jobs Online] ${log.subject}`,
      html: buildEmailHtml(bodyText, cta, unsubscribeUrl),
    })

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'sent',
        email: user.email,
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        email: user.email,
        error: errorMsg,
      },
    })
  }
}

async function sendTransactionalEmail(
  log: { id: string; userId: string | null; email: string; subject: string; error: string | null },
  type: 'password_reset' | 'email_verification',
) {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const token = log.error

  if (!token) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'failed', error: 'Missing token' },
    })
    return
  }

  // Look up user for personalization
  let name = 'there'
  if (log.userId) {
    const user = await prisma.user.findUnique({
      where: { id: log.userId },
      select: { name: true },
    })
    if (user?.name) name = user.name
  }

  let subject: string
  let html: string

  if (type === 'password_reset') {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    subject = '[VA Jobs Online] Reset your password'
    html = buildEmailHtml(
      `Hi ${name},<br><br>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.<br><br>If you did not request this, you can safely ignore this email.`,
      { text: 'Reset Password', url: resetUrl },
    )
  } else {
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`
    subject = 'Verify your email - VA Jobs Online'
    html = buildEmailHtml(
      `Hi ${name},<br><br>Thanks for signing up! Click the button below to verify your email address and activate your account.`,
      { text: 'Verify Email', url: verifyUrl },
    )
  }

  try {
    await sendEmail({ to: log.email, subject, html })

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'sent' },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'failed', error: errorMsg },
    })
  }
}

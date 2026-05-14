import { prisma } from '@/lib/prisma'
import { sendEmail, buildEmailHtml } from '@/lib/email'
import { logger } from '@/lib/logger'

type EmailJob = {
  userId: string
  type: string
  title: string
  body: string
  link?: string
  baseUrl: string
}

const queue: EmailJob[] = []
let processing = false

async function processQueue() {
  if (processing || queue.length === 0) return
  processing = true

  while (queue.length > 0) {
    const job = queue.shift()!
    try {
      await processJob(job)
    } catch (err) {
      logger.error('Email Worker', `Job failed: ${job.type} -> ${job.userId}`, err instanceof Error ? err.stack : err)
    }
  }

  processing = false
}

async function processJob(job: EmailJob) {
  if (!process.env.RESEND_API_KEY) return

  const user = await prisma.user.findUnique({
    where: { id: job.userId },
    select: { email: true },
  })
  if (!user?.email) return

  // Check if user has opted out of this notification type
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId: job.userId, type: job.type } },
  })
  if (pref?.email === false) return

  const cta = job.link
    ? { text: 'View on Talent Hub', url: `${job.baseUrl}${job.link}` }
    : undefined
  const unsubscribeUrl = `${job.baseUrl}/dashboard/settings/notifications`

  try {
    await sendEmail({
      to: user.email,
      subject: `[Talent Hub] ${job.title}`,
      html: buildEmailHtml(job.body, cta, unsubscribeUrl),
    })

    await prisma.emailLog.create({
      data: {
        userId: job.userId,
        email: user.email,
        type: job.type,
        subject: job.title,
        status: 'sent',
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'

    await prisma.emailLog.create({
      data: {
        userId: job.userId,
        email: user.email,
        type: job.type,
        subject: job.title,
        status: 'failed',
        error: errorMsg,
      },
    })
  }
}

export function enqueueEmail(job: EmailJob) {
  queue.push(job)
  if (!processing) {
    setImmediate(processQueue)
  }
}

export function getQueueLength() {
  return queue.length
}

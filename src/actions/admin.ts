'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ci } from '@/lib/db-utils'

export async function updateUserRole(userId: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const role = formData.get('role') as string
  if (!['guest', 'talent', 'client', 'admin'].includes(role)) {
    return { error: 'Invalid role' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function updateUserConnects(userId: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const amount = parseInt(formData.get('connects') as string)
  if (isNaN(amount) || amount < 0) return { error: 'Invalid amount' }

  await prisma.user.update({
    where: { id: userId },
    data: { connects: amount },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function toggleVerification(userId: string, verified: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, verified },
    update: { verified },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function getEmailLogs(params: {
  status?: string
  type?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { logs: [], total: 0 }

  const { status, type, search, page = 1, pageSize = 50 } = params

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { email: ci(search) },
      { subject: ci(search) },
    ]
  }

  const [total, logs] = await Promise.all([
    prisma.emailLog.count({ where: where as any }),
    prisma.emailLog.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    total,
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  }
}

export async function getEmailLogStats() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null

  const [total, sent, failed, pending, recentCount] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: 'sent' } }),
    prisma.emailLog.count({ where: { status: 'failed' } }),
    prisma.emailLog.count({ where: { status: 'pending' } }),
    prisma.emailLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000 * 7) } },
    }),
  ])

  return { total, sent, failed, pending, recentCount }
}

export async function retryFailedEmail(emailLogId: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }

  const log = await prisma.emailLog.findUnique({ where: { id: emailLogId } })
  if (!log) return { error: 'Log not found' }
  if (log.status !== 'failed') return { error: 'Can only retry failed emails' }

  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: { status: 'pending', error: null },
  })

  return { success: true }
}

export async function processAllPending() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }

  const { processPendingEmails } = await import('@/lib/email/worker')
  const result = await processPendingEmails(50)

  return { success: true, ...result }
}

export async function getMembershipEnabled() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null

  const setting = await prisma.paymentSetting.findUnique({
    where: { key: 'memberships_enabled' },
  })
  return setting?.value !== 'false'
}

export async function toggleMembershipAccess() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }

  const current = await prisma.paymentSetting.findUnique({
    where: { key: 'memberships_enabled' },
  })
  const nowEnabled = current?.value === 'false'

  await prisma.paymentSetting.upsert({
    where: { key: 'memberships_enabled' },
    create: { key: 'memberships_enabled', value: 'true' },
    update: { value: nowEnabled ? 'true' : 'false' },
  })

  return { success: true, enabled: nowEnabled }
}

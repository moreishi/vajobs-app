'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/actions/notifications'

export type SavedSearchAlertData = {
  id: string
  type: string
  name: string
  filters: Record<string, string>
  active: boolean
  lastMatchedAt: string | null
  createdAt: string
}

export async function createAlert(data: {
  type: string
  name: string
  filters: Record<string, string>
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.savedSearchAlert.create({
    data: {
      userId: session.user.id,
      type: data.type,
      name: data.name,
      filters: JSON.stringify(data.filters),
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.savedSearchAlert.deleteMany({
    where: { id: alertId, userId: session.user.id },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleAlert(alertId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.savedSearchAlert.updateMany({
    where: { id: alertId, userId: session.user.id },
    data: { active },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getAlerts() {
  const session = await auth()
  if (!session?.user?.id) return []

  const alerts = await prisma.savedSearchAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return alerts.map((a) => ({
    ...a,
    filters: JSON.parse(a.filters) as Record<string, string>,
    lastMatchedAt: a.lastMatchedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }))
}

// Check alerts against new jobs — called after job creation
export async function checkJobAlerts(
  jobId: string,
  jobTitle: string,
  jobSkills: string[],
  jobLocation: string | null,
  jobType: string,
) {
  const activeAlerts = await prisma.savedSearchAlert.findMany({
    where: { type: 'jobs', active: true },
    include: { user: { select: { id: true, email: true } } },
    take: 500,
  })

  for (const alert of activeAlerts) {
    const filters = JSON.parse(alert.filters) as Record<string, string>
    let matches = true

    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (!jobTitle.toLowerCase().includes(q)) matches = false
    }
    if (filters.type && jobType !== filters.type) matches = false
    if (filters.location && jobLocation) {
      if (!jobLocation.toLowerCase().includes(filters.location.toLowerCase())) matches = false
    }
    if (filters.skills) {
      const skillFilters = filters.skills.split(',').map((s: string) => s.trim().toLowerCase())
      const hasMatch = skillFilters.some((sf: string) =>
        jobSkills.some((js) => js.toLowerCase().includes(sf))
      )
      if (!hasMatch) matches = false
    }

    if (matches) {
      await prisma.savedSearchAlert.update({
        where: { id: alert.id },
        data: { lastMatchedAt: new Date() },
      })
      await createNotification({
        userId: alert.userId,
        type: 'application_received',
        title: `New job match: ${jobTitle}`,
        body: `A new job "${jobTitle}" matches your saved search "${alert.name}".`,
        link: `/jobs/${jobId}`,
      })
    }
  }
}

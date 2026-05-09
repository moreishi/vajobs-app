'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import type { ApplicationStatus, InterviewStatus } from '@/types'

const VALID_STATUSES: ApplicationStatus[] = ['pending', 'reviewed', 'interview', 'accepted', 'rejected']
const TERMINAL_STATUSES: ApplicationStatus[] = ['accepted', 'rejected', 'withdrawn']
const INTERVIEW_STATUS: ApplicationStatus = 'interview'

export async function applyToJob(jobId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'talent') return { error: 'Only talents can apply to jobs' }

  const job = await prisma.jobPost.findUnique({ where: { id: jobId } })
  if (!job) return { error: 'Job not found' }
  if (job.status !== 'open') return { error: 'This job is no longer accepting applications' }

  const existing = await prisma.application.findUnique({
    where: { jobPostId_applicantId: { jobPostId: jobId, applicantId: session.user.id } },
  })
  if (existing) return { error: 'You have already applied to this job' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { connects: true },
  })
  if (!user) return { error: 'User not found' }

  const biddingConnects = Math.min(Math.max(parseInt(formData.get('biddingConnects') as string) || 1, 1), 10)
  if (user.connects < biddingConnects) {
    return { error: `Insufficient connects. You have ${user.connects} connects but need ${biddingConnects}.` }
  }

  const coverLetter = formData.get('coverLetter') as string | null

  await prisma.$transaction([
    prisma.application.create({
      data: {
        jobPostId: jobId,
        applicantId: session.user.id,
        coverLetter: coverLetter?.trim() || null,
        biddingConnects,
        conversation: { create: {} },
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { connects: { decrement: biddingConnects } },
    }),
  ])

  revalidatePath(ROUTES.JOB_DETAIL(jobId))
  redirect(ROUTES.DASHBOARD_APPLICATIONS)
}

export async function grantMonthlyConnects() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'admin') return { error: 'Only admins can trigger monthly grants' }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const users = await prisma.user.findMany({
    where: {
      role: 'talent',
      OR: [
        { lastConnectsReset: null },
        { lastConnectsReset: { lte: thirtyDaysAgo } },
      ],
    },
  })

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        connects: { increment: 10 },
        lastConnectsReset: new Date(),
      },
    })
  }

  return { success: true, message: `Granted 10 connects to ${users.length} talent(s)` }
}

export async function addConnects(userId: string, amount: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'admin') return { error: 'Only admins can add connects' }
  if (amount < 1) return { error: 'Amount must be at least 1' }

  await prisma.user.update({
    where: { id: userId },
    data: { connects: { increment: amount } },
  })

  return { success: true }
}

export async function updateApplicationStatus(applicationId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const status = formData.get('status') as string
  if (!VALID_STATUSES.includes(status as ApplicationStatus)) {
    return { error: 'Invalid status' }
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true } } },
  })
  if (!application) return { error: 'Application not found' }
  if (application.jobPost.posterId !== session.user.id) {
    return { error: 'Only the job poster can update application status' }
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true as const }
}

export async function withdrawApplication(applicationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const application = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!application) return { error: 'Application not found' }
  if (application.applicantId !== session.user.id) return { error: 'Not authorized' }
  if (TERMINAL_STATUSES.includes(application.status as ApplicationStatus)) {
    return { error: 'Cannot withdraw from a closed application' }
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'withdrawn' },
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATIONS)
  return { success: true as const }
}

export async function sendMessage(applicationId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const content = (formData.get('content') as string)?.trim()
  if (!content) return { error: 'Message cannot be empty' }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true } } },
  })
  if (!application) return { error: 'Application not found' }

  const isApplicant = application.applicantId === session.user.id
  const isPoster = application.jobPost.posterId === session.user.id
  if (!isApplicant && !isPoster) return { error: 'Not authorized' }

  let conversation = await prisma.conversation.findUnique({ where: { applicationId } })
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { applicationId } })
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      content,
    },
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true as const }
}

export async function scheduleInterview(applicationId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can schedule interviews' }
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true } } },
  })
  if (!application) return { error: 'Application not found' }
  if (application.jobPost.posterId !== session.user.id) {
    return { error: 'Only the job poster can schedule interviews' }
  }

  const scheduledAt = formData.get('scheduledAt') as string
  if (!scheduledAt) return { error: 'Interview date and time is required' }

  const scheduledDate = new Date(scheduledAt)
  if (isNaN(scheduledDate.getTime())) return { error: 'Invalid date' }

  const duration = parseInt(formData.get('duration') as string) || 60
  const meetingLink = (formData.get('meetingLink') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: { status: INTERVIEW_STATUS },
    }),
    prisma.interview.upsert({
      where: { applicationId },
      create: { applicationId, scheduledAt: scheduledDate, duration, meetingLink, notes },
      update: { scheduledAt: scheduledDate, duration, meetingLink, notes, status: 'scheduled' },
    }),
  ])

  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true as const }
}

export async function cancelInterview(applicationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true } } },
  })
  if (!application) return { error: 'Application not found' }
  if (application.jobPost.posterId !== session.user.id) {
    return { error: 'Only the job poster can cancel interviews' }
  }

  await prisma.interview.update({
    where: { applicationId },
    data: { status: 'cancelled' },
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true as const }
}

export async function getApplicationById(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      jobPost: { select: { id: true, title: true, posterId: true, posterName: true } },
      applicant: { select: { id: true, name: true, email: true } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      interview: true,
    },
  })

  if (!application) return null

  const isApplicant = application.applicantId === session.user.id
  const isPoster = application.jobPost.posterId === session.user.id
  if (!isApplicant && !isPoster) return null

  return {
    ...application,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    interview: application.interview
      ? {
          ...application.interview,
          status: application.interview.status as InterviewStatus,
          scheduledAt: application.interview.scheduledAt.toISOString(),
          createdAt: application.interview.createdAt.toISOString(),
          updatedAt: application.interview.updatedAt.toISOString(),
        }
      : null,
    conversation: application.conversation
      ? {
          ...application.conversation,
          createdAt: application.conversation.createdAt.toISOString(),
          updatedAt: application.conversation.updatedAt.toISOString(),
          messages: application.conversation.messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          })),
        }
      : null,
  }
}

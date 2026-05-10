'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { createNotification } from '@/actions/notifications'

export async function getJobProposals(jobPostId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { posterId: true },
  })
  if (!job) return { error: 'Job not found' }
  if (job.posterId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Only the job poster can view proposals' }
  }

  const applications = await prisma.application.findMany({
    where: { jobPostId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ bidAmount: 'desc' }, { biddingConnects: 'desc' }],
  })

  return {
    success: true as const,
    data: applications.map((app) => ({
      id: app.id,
      applicantId: app.applicantId,
      applicantName: app.applicant.name || app.applicant.email,
      applicantEmail: app.applicant.email,
      coverLetter: app.coverLetter,
      status: app.status,
      biddingConnects: app.biddingConnects,
      bidAmount: app.bidAmount,
      bidType: app.bidType,
      timeline: app.timeline,
      approach: app.approach,
      createdAt: app.createdAt.toISOString(),
    })),
  }
}

export async function acceptProposal(
  applicationId: string,
): Promise<{ error: string } | { success: true; engagementId: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can accept proposals' }
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      jobPost: { select: { posterId: true, title: true, description: true } },
    },
  })
  if (!application) return { error: 'Application not found' }
  if (application.jobPost.posterId !== session.user.id) {
    return { error: 'Only the job poster can accept proposals' }
  }
  if (application.status === 'accepted') return { error: 'Proposal already accepted' }

  const existingEngagement = await prisma.engagement.findUnique({
    where: { applicationId },
  })
  if (existingEngagement) return { error: 'An engagement already exists for this application' }

  // Create engagement
  const engagement = await prisma.engagement.create({
    data: {
      applicationId,
      talentId: application.applicantId,
      clientId: application.jobPost.posterId,
      jobPostId: application.jobPostId,
      rate: application.bidAmount || undefined,
    },
  })

  // Auto-create contract + milestone from proposal data
  if (application.bidAmount) {
    const endDate = application.timeline
      ? new Date(Date.now() + application.timeline * 86400000)
      : null

    const contract = await prisma.contract.create({
      data: {
        engagementId: engagement.id,
        clientId: application.jobPost.posterId,
        talentId: application.applicantId,
        title: `Contract: ${application.jobPost.title}`,
        terms: application.approach || application.coverLetter?.slice(0, 2000) || 'Work agreement',
        rate: application.bidAmount,
        rateType: application.bidType,
        startDate: new Date(),
        endDate,
        status: 'draft',
      },
    })

    await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title: `Complete ${application.jobPost.title}`,
        description: application.approach?.slice(0, 500) || undefined,
        amount: application.bidAmount,
        dueDate: endDate,
      },
    })
  }

  // Update application status
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'accepted' },
  })

  await createNotification({
    userId: application.applicantId,
    type: 'proposal_accepted',
    title: 'Proposal Accepted!',
    body: `Your proposal for "${application.jobPost.title}" has been accepted.`,
    link: ROUTES.ENGAGEMENT_DETAIL(engagement.id),
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATIONS)
  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true as const, engagementId: engagement.id }
}

export async function updateProposal(
  applicationId: string,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'talent') return { error: 'Only talents can edit proposals' }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPost: { select: { posterId: true, title: true } } },
  })
  if (!application) return { error: 'Application not found' }
  if (application.applicantId !== session.user.id) return { error: 'Not authorized' }

  const terminalStatuses = ['accepted', 'rejected', 'withdrawn']
  if (terminalStatuses.includes(application.status)) {
    return { error: 'Cannot edit a closed proposal' }
  }

  const bidAmount = parseFloat(formData.get('bidAmount') as string) || null
  const bidType = (formData.get('bidType') as string) || 'fixed'
  const timeline = parseInt(formData.get('timeline') as string) || null
  const approach = (formData.get('approach') as string)?.trim() || null

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      bidAmount: bidAmount && bidAmount > 0 ? bidAmount : null,
      bidType,
      timeline: timeline && timeline > 0 ? timeline : null,
      approach,
    },
  })

  await createNotification({
    userId: application.jobPost.posterId,
    type: 'proposal_updated',
    title: 'Proposal Updated',
    body: `The proposal for "${application.jobPost.title}" has been revised.`,
    link: ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId),
  })

  revalidatePath(ROUTES.DASHBOARD_APPLICATION_DETAIL(applicationId))
  return { success: true }
}

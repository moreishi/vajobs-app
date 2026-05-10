'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'

export type Question = {
  id: string
  question: string
}

export type AssessmentData = {
  id: string
  jobPostId: string
  title: string
  description: string | null
  questions: Question[]
  passScore: number | null
  timeLimit: number | null
  createdAt: string
}

export async function createAssessment(data: {
  jobPostId: string
  title: string
  description?: string
  questions: Question[]
  passScore?: number
  timeLimit?: number
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can create assessments' }
  }

  const job = await prisma.jobPost.findUnique({ where: { id: data.jobPostId } })
  if (!job) return { error: 'Job not found' }
  if (job.posterId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.questions || data.questions.length === 0) {
    return { error: 'At least one question is required' }
  }

  await prisma.skillAssessment.create({
    data: {
      jobPostId: data.jobPostId,
      clientId: session.user.id,
      title: data.title,
      description: data.description || null,
      questions: JSON.stringify(data.questions),
      passScore: data.passScore || null,
      timeLimit: data.timeLimit || null,
    },
  })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function updateAssessment(
  assessmentId: string,
  data: {
    title: string
    description?: string
    questions: Question[]
    passScore?: number
    timeLimit?: number
  },
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const assessment = await prisma.skillAssessment.findUnique({
    where: { id: assessmentId },
  })
  if (!assessment) return { error: 'Assessment not found' }
  if (assessment.clientId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.questions || data.questions.length === 0) {
    return { error: 'At least one question is required' }
  }

  await prisma.skillAssessment.update({
    where: { id: assessmentId },
    data: {
      title: data.title,
      description: data.description || null,
      questions: JSON.stringify(data.questions),
      passScore: data.passScore || null,
      timeLimit: data.timeLimit || null,
    },
  })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function deleteAssessment(assessmentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const assessment = await prisma.skillAssessment.findUnique({
    where: { id: assessmentId },
  })
  if (!assessment) return { error: 'Assessment not found' }
  if (assessment.clientId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  await prisma.skillAssessment.delete({ where: { id: assessmentId } })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function getAssessments(jobPostId: string) {
  const assessments = await prisma.skillAssessment.findMany({
    where: { jobPostId },
    orderBy: { createdAt: 'desc' },
  })

  return assessments.map((a) => ({
    ...a,
    questions: JSON.parse(a.questions) as Question[],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}

export async function getAssessment(assessmentId: string) {
  const session = await auth()

  const assessment = await prisma.skillAssessment.findUnique({
    where: { id: assessmentId },
  })
  if (!assessment) return null

  return {
    ...assessment,
    questions: JSON.parse(assessment.questions) as Question[],
    createdAt: assessment.createdAt.toISOString(),
    updatedAt: assessment.updatedAt.toISOString(),
  }
}

export async function submitAssessment(
  assessmentId: string,
  applicationId: string,
  answers: { questionId: string; answer: string }[],
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'talent') return { error: 'Only talents can submit assessments' }

  const assessment = await prisma.skillAssessment.findUnique({
    where: { id: assessmentId },
  })
  if (!assessment) return { error: 'Assessment not found' }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  })
  if (!application) return { error: 'Application not found' }
  if (application.applicantId !== session.user.id) return { error: 'Not authorized' }

  const existing = await prisma.assessmentAttempt.findUnique({
    where: { applicationId },
  })
  if (existing) return { error: 'You have already submitted this assessment' }

  await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      applicantId: session.user.id,
      applicationId,
      answers: JSON.stringify(answers),
      completedAt: new Date(),
    },
  })

  revalidatePath(ROUTES.JOBS)
  return { success: true }
}

export async function gradeAssessment(
  attemptId: string,
  score: number,
  passed: boolean,
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { select: { clientId: true, title: true } },
      application: {
        include: { jobPost: { select: { posterId: true } } },
      },
    },
  })
  if (!attempt) return { error: 'Attempt not found' }
  if (attempt.application.jobPost.posterId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  if (score < 0 || score > 100) return { error: 'Score must be between 0 and 100' }

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { score, passed },
  })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function getAssessmentAttempt(applicationId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { applicationId },
    include: {
      assessment: {
        select: { id: true, title: true, questions: true, passScore: true },
      },
      application: {
        select: { jobPost: { select: { posterId: true } } },
      },
    },
  })
  if (!attempt) return null

  const isApplicant = attempt.applicantId === session.user.id
  const isOwner = attempt.application?.jobPost?.posterId === session.user.id || session.user.role === 'admin'
  if (!isApplicant && !isOwner) return null

  return {
    ...attempt,
    answers: JSON.parse(attempt.answers) as { questionId: string; answer: string }[],
    assessment: {
      ...attempt.assessment,
      questions: JSON.parse(attempt.assessment.questions) as Question[],
    },
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
  }
}
